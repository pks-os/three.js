import NodeUniformsGroup from '../../common/nodes/NodeUniformsGroup.js';

import NodeSampler from '../../common/nodes/NodeSampler.js';
import { NodeSampledTexture, NodeSampledCubeTexture, NodeSampledTexture3D } from '../../common/nodes/NodeSampledTexture.js';

import NodeUniformBuffer from '../../common/nodes/NodeUniformBuffer.js';
import NodeStorageBuffer from '../../common/nodes/NodeStorageBuffer.js';

import { NodeBuilder, CodeNode } from '../../../nodes/Nodes.js';

import { getFormat } from '../utils/WebGPUTextureUtils.js';

import WGSLNodeParser from './WGSLNodeParser.js';
import { NodeAccess } from '../../../nodes/core/constants.js';

import VarNode from '../../../nodes/core/VarNode.js';
import ExpressionNode from '../../../nodes/code/ExpressionNode.js';

import { NoColorSpace, FloatType, RepeatWrapping, ClampToEdgeWrapping, MirroredRepeatWrapping, NearestFilter } from '../../../constants.js';

// GPUShaderStage is not defined in browsers not supporting WebGPU
const GPUShaderStage = ( typeof self !== 'undefined' ) ? self.GPUShaderStage : { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };

const accessNames = {
	[ NodeAccess.READ_ONLY ]: 'read',
	[ NodeAccess.WRITE_ONLY ]: 'write',
	[ NodeAccess.READ_WRITE ]: 'read_write'
};

const wrapNames = {
	[ RepeatWrapping ]: 'repeat',
	[ ClampToEdgeWrapping ]: 'clamp',
	[ MirroredRepeatWrapping ]: 'mirror'
};

const gpuShaderStageLib = {
	'vertex': GPUShaderStage ? GPUShaderStage.VERTEX : 1,
	'fragment': GPUShaderStage ? GPUShaderStage.FRAGMENT : 2,
	'compute': GPUShaderStage ? GPUShaderStage.COMPUTE : 4
};

const supports = {
	instance: true,
	swizzleAssign: false,
	storageBuffer: true
};

const wgslFnOpLib = {
	'^^': 'tsl_xor'
};

const wgslTypeLib = {
	float: 'f32',
	int: 'i32',
	uint: 'u32',
	bool: 'bool',
	color: 'vec3<f32>',

	vec2: 'vec2<f32>',
	ivec2: 'vec2<i32>',
	uvec2: 'vec2<u32>',
	bvec2: 'vec2<bool>',

	vec3: 'vec3<f32>',
	ivec3: 'vec3<i32>',
	uvec3: 'vec3<u32>',
	bvec3: 'vec3<bool>',

	vec4: 'vec4<f32>',
	ivec4: 'vec4<i32>',
	uvec4: 'vec4<u32>',
	bvec4: 'vec4<bool>',

	mat2: 'mat2x2<f32>',
	mat3: 'mat3x3<f32>',
	mat4: 'mat4x4<f32>'
};

const wgslCodeCache = {};

const wgslPolyfill = {
	tsl_xor: new CodeNode( 'fn tsl_xor( a : bool, b : bool ) -> bool { return ( a || b ) && !( a && b ); }' ),
	mod_float: new CodeNode( 'fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }' ),
	mod_vec2: new CodeNode( 'fn tsl_mod_vec2( x : vec2f, y : vec2f ) -> vec2f { return x - y * floor( x / y ); }' ),
	mod_vec3: new CodeNode( 'fn tsl_mod_vec3( x : vec3f, y : vec3f ) -> vec3f { return x - y * floor( x / y ); }' ),
	mod_vec4: new CodeNode( 'fn tsl_mod_vec4( x : vec4f, y : vec4f ) -> vec4f { return x - y * floor( x / y ); }' ),
	equals_bool: new CodeNode( 'fn tsl_equals_bool( a : bool, b : bool ) -> bool { return a == b; }' ),
	equals_bvec2: new CodeNode( 'fn tsl_equals_bvec2( a : vec2f, b : vec2f ) -> vec2<bool> { return vec2<bool>( a.x == b.x, a.y == b.y ); }' ),
	equals_bvec3: new CodeNode( 'fn tsl_equals_bvec3( a : vec3f, b : vec3f ) -> vec3<bool> { return vec3<bool>( a.x == b.x, a.y == b.y, a.z == b.z ); }' ),
	equals_bvec4: new CodeNode( 'fn tsl_equals_bvec4( a : vec4f, b : vec4f ) -> vec4<bool> { return vec4<bool>( a.x == b.x, a.y == b.y, a.z == b.z, a.w == b.w ); }' ),
	repeatWrapping_float: new CodeNode( 'fn tsl_repeatWrapping_float( coord: f32 ) -> f32 { return fract( coord ); }' ),
	mirrorWrapping_float: new CodeNode( 'fn tsl_mirrorWrapping_float( coord: f32 ) -> f32 { let mirrored = fract( coord * 0.5 ) * 2.0; return 1.0 - abs( 1.0 - mirrored ); }' ),
	clampWrapping_float: new CodeNode( 'fn tsl_clampWrapping_float( coord: f32 ) -> f32 { return clamp( coord, 0.0, 1.0 ); }' ),
	biquadraticTexture: new CodeNode( /* wgsl */`
fn tsl_biquadraticTexture( map : texture_2d<f32>, coord : vec2f, iRes : vec2u, level : u32 ) -> vec4f {

	let res = vec2f( iRes );

	let uvScaled = coord * res;
	let uvWrapping = ( ( uvScaled % res ) + res ) % res;

	// https://www.shadertoy.com/view/WtyXRy

	let uv = uvWrapping - 0.5;
	let iuv = floor( uv );
	let f = fract( uv );

	let rg1 = textureLoad( map, vec2u( iuv + vec2( 0.5, 0.5 ) ) % iRes, level );
	let rg2 = textureLoad( map, vec2u( iuv + vec2( 1.5, 0.5 ) ) % iRes, level );
	let rg3 = textureLoad( map, vec2u( iuv + vec2( 0.5, 1.5 ) ) % iRes, level );
	let rg4 = textureLoad( map, vec2u( iuv + vec2( 1.5, 1.5 ) ) % iRes, level );

	return mix( mix( rg1, rg2, f.x ), mix( rg3, rg4, f.x ), f.y );

}
` )
};

const wgslMethods = {
	dFdx: 'dpdx',
	dFdy: '- dpdy',
	mod_float: 'tsl_mod_float',
	mod_vec2: 'tsl_mod_vec2',
	mod_vec3: 'tsl_mod_vec3',
	mod_vec4: 'tsl_mod_vec4',
	equals_bool: 'tsl_equals_bool',
	equals_bvec2: 'tsl_equals_bvec2',
	equals_bvec3: 'tsl_equals_bvec3',
	equals_bvec4: 'tsl_equals_bvec4',
	inversesqrt: 'inverseSqrt',
	bitcast: 'bitcast<f32>'
};

// WebGPU issue: does not support pow() with negative base on Windows

if ( typeof navigator !== 'undefined' && /Windows/g.test( navigator.userAgent ) ) {

	wgslPolyfill.pow_float = new CodeNode( 'fn tsl_pow_float( a : f32, b : f32 ) -> f32 { return select( -pow( -a, b ), pow( a, b ), a > 0.0 ); }' );
	wgslPolyfill.pow_vec2 = new CodeNode( 'fn tsl_pow_vec2( a : vec2f, b : vec2f ) -> vec2f { return vec2f( tsl_pow_float( a.x, b.x ), tsl_pow_float( a.y, b.y ) ); }', [ wgslPolyfill.pow_float ] );
	wgslPolyfill.pow_vec3 = new CodeNode( 'fn tsl_pow_vec3( a : vec3f, b : vec3f ) -> vec3f { return vec3f( tsl_pow_float( a.x, b.x ), tsl_pow_float( a.y, b.y ), tsl_pow_float( a.z, b.z ) ); }', [ wgslPolyfill.pow_float ] );
	wgslPolyfill.pow_vec4 = new CodeNode( 'fn tsl_pow_vec4( a : vec4f, b : vec4f ) -> vec4f { return vec4f( tsl_pow_float( a.x, b.x ), tsl_pow_float( a.y, b.y ), tsl_pow_float( a.z, b.z ), tsl_pow_float( a.w, b.w ) ); }', [ wgslPolyfill.pow_float ] );

	wgslMethods.pow_float = 'tsl_pow_float';
	wgslMethods.pow_vec2 = 'tsl_pow_vec2';
	wgslMethods.pow_vec3 = 'tsl_pow_vec3';
	wgslMethods.pow_vec4 = 'tsl_pow_vec4';

}

//

let diagnostics = '';

if ( ( typeof navigator !== 'undefined' && /Firefox|Deno/g.test( navigator.userAgent ) ) !== true ) {

	diagnostics += 'diagnostic( off, derivative_uniformity );\n';

}

/**
 * A node builder targeting WGSL.
 *
 * This module generates WGSL shader code from node materials and also
 * generates the respective bindings and vertex buffer definitions. These
 * data are later used by the renderer to create render and compute pipelines
 * for render objects.
 *
 * @augments NodeBuilder
 */
class WGSLNodeBuilder extends NodeBuilder {

	/**
	 * Constructs a new WGSL node builder renderer.
	 *
	 * @param {Object3D} object - The 3D object.
	 * @param {Renderer} renderer - The renderer.
	 */
	constructor( object, renderer ) {

		super( object, renderer, new WGSLNodeParser() );

		/**
		 * A dictionary that holds for each shader stage ('vertex', 'fragment', 'compute')
		 * another dictionary which manages UBOs per group ('render','frame','object').
		 *
		 * @type {Object<String,Object<String,NodeUniformsGroup>>}
		 */
		this.uniformGroups = {};

		/**
		 * A dictionary that holds for each shader stage a Map of builtins.
		 *
		 * @type {Object<String,Map<String,Object>>}
		 */
		this.builtins = {};

		/**
		 * A dictionary that holds for each shader stage a Set of directives.
		 *
		 * @type {Object<String,Set<String>>}
		 */
		this.directives = {};

		/**
		 * A map for managing scope arrays. Only relevant for when using
		 * {@link module:WorkgroupInfoNode} in context of compute shaders.
		 *
		 * @type {Map<String,Object>}
		 */
		this.scopedArrays = new Map();

	}

	/**
	 * Checks if the given texture requires a manual conversion to the working color space.
	 *
	 * @param {Texture} texture - The texture to check.
	 * @return {Boolean} Whether the given texture requires a conversion to working color space or not.
	 */
	needsToWorkingColorSpace( texture ) {

		return texture.isVideoTexture === true && texture.colorSpace !== NoColorSpace;

	}

	/**
	 * Generates the WGSL snippet for sampled textures.
	 *
	 * @private
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	_generateTextureSample( texture, textureProperty, uvSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		if ( shaderStage === 'fragment' ) {

			if ( depthSnippet ) {

				return `textureSample( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet }, ${ depthSnippet } )`;

			} else {

				return `textureSample( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet } )`;

			}

		} else if ( this.isFilteredTexture( texture ) ) {

			return this.generateFilteredTexture( texture, textureProperty, uvSnippet );

		} else {

			return this.generateTextureLod( texture, textureProperty, uvSnippet, depthSnippet, '0' );

		}

	}

	/**
	 * Generates the WGSL snippet when sampling video textures.
	 *
	 * @private
	 * @param {String} textureProperty - The name of the video texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	_generateVideoSample( textureProperty, uvSnippet, shaderStage = this.shaderStage ) {

		if ( shaderStage === 'fragment' ) {

			return `textureSampleBaseClampToEdge( ${ textureProperty }, ${ textureProperty }_sampler, vec2<f32>( ${ uvSnippet }.x, 1.0 - ${ uvSnippet }.y ) )`;

		} else {

			console.error( `WebGPURenderer: THREE.VideoTexture does not support ${ shaderStage } shader.` );

		}

	}

	/**
	 * Generates the WGSL snippet when sampling textures with explicit mip level.
	 *
	 * @private
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} levelSnippet - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	_generateTextureSampleLevel( texture, textureProperty, uvSnippet, levelSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		if ( ( shaderStage === 'fragment' || shaderStage === 'compute' ) && this.isUnfilterable( texture ) === false ) {

			return `textureSampleLevel( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet }, ${ levelSnippet } )`;

		} else if ( this.isFilteredTexture( texture ) ) {

			return this.generateFilteredTexture( texture, textureProperty, uvSnippet, levelSnippet );

		} else {

			return this.generateTextureLod( texture, textureProperty, uvSnippet, depthSnippet, levelSnippet );

		}

	}

	/**
	 * Generates a wrap function used in context of textures.
	 *
	 * @param {Texture} texture - The texture to generate the function for.
	 * @return {String} The name of the generated function.
	 */
	generateWrapFunction( texture ) {

		const functionName = `tsl_coord_${ wrapNames[ texture.wrapS ] }S_${ wrapNames[ texture.wrapT ] }_${texture.isData3DTexture ? '3d' : '2d'}T`;

		let nodeCode = wgslCodeCache[ functionName ];

		if ( nodeCode === undefined ) {

			const includes = [];

			// For 3D textures, use vec3f; for texture arrays, keep vec2f since array index is separate
			const coordType = texture.isData3DTexture ? 'vec3f' : 'vec2f';
			let code = `fn ${functionName}( coord : ${coordType} ) -> ${coordType} {\n\n\treturn ${coordType}(\n`;

			const addWrapSnippet = ( wrap, axis ) => {

				if ( wrap === RepeatWrapping ) {

					includes.push( wgslPolyfill.repeatWrapping_float );

					code += `\t\ttsl_repeatWrapping_float( coord.${ axis } )`;

				} else if ( wrap === ClampToEdgeWrapping ) {

					includes.push( wgslPolyfill.clampWrapping_float );

					code += `\t\ttsl_clampWrapping_float( coord.${ axis } )`;

				} else if ( wrap === MirroredRepeatWrapping ) {

					includes.push( wgslPolyfill.mirrorWrapping_float );

					code += `\t\ttsl_mirrorWrapping_float( coord.${ axis } )`;

				} else {

					code += `\t\tcoord.${ axis }`;

					console.warn( `WebGPURenderer: Unsupported texture wrap type "${ wrap }" for vertex shader.` );

				}

			};

			addWrapSnippet( texture.wrapS, 'x' );

			code += ',\n';

			addWrapSnippet( texture.wrapT, 'y' );

			if ( texture.isData3DTexture ) {

				code += ',\n';
				addWrapSnippet( texture.wrapR, 'z' );

			}

			code += '\n\t);\n\n}\n';

			wgslCodeCache[ functionName ] = nodeCode = new CodeNode( code, includes );

		}

		nodeCode.build( this );

		return functionName;

	}

	/**
	 * Generates a WGSL variable that holds the texture dimension of the given texture.
	 * It also returns information about the the number of layers (elements) of an arrayed
	 * texture as well as the cube face count of cube textures.
	 *
	 * @param {Texture} texture - The texture to generate the function for.
	 * @param {String} textureProperty - The name of the video texture uniform in the shader.
	 * @param {String} levelSnippet - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @return {String} The name of the dimension variable.
	 */
	generateTextureDimension( texture, textureProperty, levelSnippet ) {

		const textureData = this.getDataFromNode( texture, this.shaderStage, this.globalCache );

		if ( textureData.dimensionsSnippet === undefined ) textureData.dimensionsSnippet = {};

		let textureDimensionNode = textureData.dimensionsSnippet[ levelSnippet ];

		if ( textureData.dimensionsSnippet[ levelSnippet ] === undefined ) {

			let textureDimensionsParams;
			let dimensionType;

			const { primarySamples } = this.renderer.backend.utils.getTextureSampleData( texture );
			const isMultisampled = primarySamples > 1;

			if ( texture.isData3DTexture ) {

				dimensionType = 'vec3<u32>';

			} else {

				// Regular 2D textures, depth textures, etc.
				dimensionType = 'vec2<u32>';

			}

			// Build parameters string based on texture type and multisampling
			if ( isMultisampled || texture.isVideoTexture || texture.isStorageTexture ) {

				textureDimensionsParams = textureProperty;

			} else {

				textureDimensionsParams = `${textureProperty}${levelSnippet ? `, u32( ${ levelSnippet } )` : ''}`;

			}

			textureDimensionNode = new VarNode( new ExpressionNode( `textureDimensions( ${ textureDimensionsParams } )`, dimensionType ) );

			textureData.dimensionsSnippet[ levelSnippet ] = textureDimensionNode;

			if ( texture.isDataArrayTexture || texture.isData3DTexture ) {

				textureData.arrayLayerCount = new VarNode(
					new ExpressionNode(
						`textureNumLayers(${textureProperty})`,
						'u32'
					)
				);

			}

			// For cube textures, we know it's always 6 faces
			if ( texture.isTextureCube ) {

				textureData.cubeFaceCount = new VarNode(
					new ExpressionNode( '6u', 'u32' )
				);

			}

		}

		return textureDimensionNode.build( this );

	}

	/**
	 * Generates the WGSL snippet for a manual filtered texture.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} levelSnippet - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @return {String} The WGSL snippet.
	 */
	generateFilteredTexture( texture, textureProperty, uvSnippet, levelSnippet = '0u' ) {

		this._include( 'biquadraticTexture' );

		const wrapFunction = this.generateWrapFunction( texture );
		const textureDimension = this.generateTextureDimension( texture, textureProperty, levelSnippet );

		return `tsl_biquadraticTexture( ${ textureProperty }, ${ wrapFunction }( ${ uvSnippet } ), ${ textureDimension }, u32( ${ levelSnippet } ) )`;

	}

	/**
	 * Generates the WGSL snippet for a texture lookup with explicit level-of-detail.
	 * Since it's a lookup, no sampling or filtering is applied.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [levelSnippet='0u'] - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureLod( texture, textureProperty, uvSnippet, depthSnippet, levelSnippet = '0u' ) {

		const wrapFunction = this.generateWrapFunction( texture );
		const textureDimension = this.generateTextureDimension( texture, textureProperty, levelSnippet );

		const vecType = texture.isData3DTexture ? 'vec3' : 'vec2';
		const coordSnippet = `${vecType}<u32>(${wrapFunction}(${uvSnippet}) * ${vecType}<f32>(${textureDimension}))`;

		return this.generateTextureLoad( texture, textureProperty, coordSnippet, depthSnippet, levelSnippet );

	}

	/**
	 * Generates the WGSL snippet that reads a single texel from a texture without sampling or filtering.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvIndexSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [levelSnippet='0u'] - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureLoad( texture, textureProperty, uvIndexSnippet, depthSnippet, levelSnippet = '0u' ) {

		if ( texture.isVideoTexture === true || texture.isStorageTexture === true ) {

			return `textureLoad( ${ textureProperty }, ${ uvIndexSnippet } )`;

		} else if ( depthSnippet ) {

			return `textureLoad( ${ textureProperty }, ${ uvIndexSnippet }, ${ depthSnippet }, u32( ${ levelSnippet } ) )`;

		} else {

			return `textureLoad( ${ textureProperty }, ${ uvIndexSnippet }, u32( ${ levelSnippet } ) )`;

		}

	}

	/**
	 * Generates the WGSL snippet that writes a single texel to a texture.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvIndexSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} valueSnippet - A WGSL snippet that represent the new texel value.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureStore( texture, textureProperty, uvIndexSnippet, valueSnippet ) {

		return `textureStore( ${ textureProperty }, ${ uvIndexSnippet }, ${ valueSnippet } )`;

	}

	/**
	 * Returns `true` if the sampled values of the given texture should be compared against a reference value.
	 *
	 * @param {Texture} texture - The texture.
	 * @return {Boolean} Whether the sampled values of the given texture should be compared against a reference value or not.
	 */
	isSampleCompare( texture ) {

		return texture.isDepthTexture === true && texture.compareFunction !== null;

	}

	/**
	 * Returns `true` if the given texture is unfilterable.
	 *
	 * @param {Texture} texture - The texture.
	 * @return {Boolean} Whether the given texture is unfilterable or not.
	 */
	isUnfilterable( texture ) {

		return this.getComponentTypeFromTexture( texture ) !== 'float' ||
			( ! this.isAvailable( 'float32Filterable' ) && texture.isDataTexture === true && texture.type === FloatType ) ||
			( this.isSampleCompare( texture ) === false && texture.minFilter === NearestFilter && texture.magFilter === NearestFilter ) ||
			this.renderer.backend.utils.getTextureSampleData( texture ).primarySamples > 1;

	}

	/**
	 * Generates the WGSL snippet for sampling/loading the given texture.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	generateTexture( texture, textureProperty, uvSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		let snippet = null;

		if ( texture.isVideoTexture === true ) {

			snippet = this._generateVideoSample( textureProperty, uvSnippet, shaderStage );

		} else if ( this.isUnfilterable( texture ) ) {

			snippet = this.generateTextureLod( texture, textureProperty, uvSnippet, depthSnippet, '0', shaderStage );

		} else {

			snippet = this._generateTextureSample( texture, textureProperty, uvSnippet, depthSnippet, shaderStage );

		}

		return snippet;

	}

	/**
	 * Generates the WGSL snippet for sampling/loading the given texture using explicit gradients.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {Array<String>} gradSnippet - An array holding both gradient WGSL snippets.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureGrad( texture, textureProperty, uvSnippet, gradSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		if ( shaderStage === 'fragment' ) {

			// TODO handle i32 or u32 --> uvSnippet, array_index: A, ddx, ddy
			return `textureSampleGrad( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet },  ${ gradSnippet[ 0 ] }, ${ gradSnippet[ 1 ] } )`;

		} else {

			console.error( `WebGPURenderer: THREE.TextureNode.gradient() does not support ${ shaderStage } shader.` );

		}

	}

	/**
	 * Generates the WGSL snippet for sampling a depth texture and comparing the sampled depth values
	 * against a reference value.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} compareSnippet -  A WGSL snippet that represents the reference value.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureCompare( texture, textureProperty, uvSnippet, compareSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		if ( shaderStage === 'fragment' ) {

			return `textureSampleCompare( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet }, ${ compareSnippet } )`;

		} else {

			console.error( `WebGPURenderer: THREE.DepthTexture.compareFunction() does not support ${ shaderStage } shader.` );

		}

	}

	/**
	 * Generates the WGSL snippet when sampling textures with explicit mip level.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} levelSnippet - A WGSL snippet that represents the mip level, with level 0 containing a full size version of the texture.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureLevel( texture, textureProperty, uvSnippet, levelSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		let snippet = null;

		if ( texture.isVideoTexture === true ) {

			snippet = this._generateVideoSample( textureProperty, uvSnippet, shaderStage );

		} else {

			snippet = this._generateTextureSampleLevel( texture, textureProperty, uvSnippet, levelSnippet, depthSnippet, shaderStage );

		}

		return snippet;

	}

	/**
	 * Generates the WGSL snippet when sampling textures with a bias to the mip level.
	 *
	 * @param {Texture} texture - The texture.
	 * @param {String} textureProperty - The name of the texture uniform in the shader.
	 * @param {String} uvSnippet - A WGSL snippet that represents texture coordinates used for sampling.
	 * @param {String} biasSnippet - A WGSL snippet that represents the bias to apply to the mip level before sampling.
	 * @param {String?} depthSnippet - A WGSL snippet that represents 0-based texture array index to sample.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The WGSL snippet.
	 */
	generateTextureBias( texture, textureProperty, uvSnippet, biasSnippet, depthSnippet, shaderStage = this.shaderStage ) {

		if ( shaderStage === 'fragment' ) {

			return `textureSampleBias( ${ textureProperty }, ${ textureProperty }_sampler, ${ uvSnippet }, ${ biasSnippet } )`;

		} else {

			console.error( `WebGPURenderer: THREE.TextureNode.biasNode does not support ${ shaderStage } shader.` );

		}

	}

	/**
	 * Returns a WGSL snippet that represents the property name of the given node.
	 *
	 * @param {Node} node - The node.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The property name.
	 */
	getPropertyName( node, shaderStage = this.shaderStage ) {

		if ( node.isNodeVarying === true && node.needsInterpolation === true ) {

			if ( shaderStage === 'vertex' ) {

				return `varyings.${ node.name }`;

			}

		} else if ( node.isNodeUniform === true ) {

			const name = node.name;
			const type = node.type;

			if ( type === 'texture' || type === 'cubeTexture' || type === 'storageTexture' || type === 'texture3D' ) {

				return name;

			} else if ( type === 'buffer' || type === 'storageBuffer' || type === 'indirectStorageBuffer' ) {

				return `NodeBuffer_${ node.id }.${name}`;

			} else {

				return node.groupNode.name + '.' + name;

			}

		}

		return super.getPropertyName( node );

	}

	/**
	 * Returns the output struct name.
	 *
	 * @return {String} The name of the output struct.
	 */
	getOutputStructName() {

		return 'output';

	}

	/**
	 * Returns uniforms group count for the given shader stage.
	 *
	 * @private
	 * @param {String} shaderStage - The shader stage.
	 * @return {Number} The uniforms group count for the given shader stage.
	 */
	_getUniformGroupCount( shaderStage ) {

		return Object.keys( this.uniforms[ shaderStage ] ).length;

	}

	/**
	 * Returns the native shader operator name for a given generic name.
	 *
	 * @param {String} op - The operator name to resolve.
	 * @return {String} The resolved operator name.
	 */
	getFunctionOperator( op ) {

		const fnOp = wgslFnOpLib[ op ];

		if ( fnOp !== undefined ) {

			this._include( fnOp );

			return fnOp;

		}

		return null;

	}

	/**
	 * Returns the node access for the given node and shader stage.
	 *
	 * @param {StorageTextureNode|StorageBufferNode} node - The storage node.
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The node access.
	 */
	getNodeAccess( node, shaderStage ) {

		if ( shaderStage !== 'compute' )
			return NodeAccess.READ_ONLY;

		return node.access;

	}

	/**
	 * Returns A WGSL snippet representing the storage access.
	 *
	 * @param {StorageTextureNode|StorageBufferNode} node - The storage node.
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet representing the storage access.
	 */
	getStorageAccess( node, shaderStage ) {

		return accessNames[ this.getNodeAccess( node, shaderStage ) ];

	}

	/**
	 * This method is one of the more important ones since it's responsible
	 * for generating a matching binding instance for the given uniform node.
	 *
	 * These bindings are later used in the renderer to create bind groups
	 * and layouts.
	 *
	 * @param {UniformNode} node - The uniform node.
	 * @param {String} type - The node data type.
	 * @param {String} shaderStage - The shader stage.
	 * @param {String?} [name=null] - An optional uniform name.
	 * @return {NodeUniform} The node uniform object.
	 */
	getUniformFromNode( node, type, shaderStage, name = null ) {

		const uniformNode = super.getUniformFromNode( node, type, shaderStage, name );
		const nodeData = this.getDataFromNode( node, shaderStage, this.globalCache );

		if ( nodeData.uniformGPU === undefined ) {

			let uniformGPU;

			const group = node.groupNode;
			const groupName = group.name;

			const bindings = this.getBindGroupArray( groupName, shaderStage );

			if ( type === 'texture' || type === 'cubeTexture' || type === 'storageTexture' || type === 'texture3D' ) {

				let texture = null;

				const access = this.getNodeAccess( node, shaderStage );

				if ( type === 'texture' || type === 'storageTexture' ) {

					texture = new NodeSampledTexture( uniformNode.name, uniformNode.node, group, access );

				} else if ( type === 'cubeTexture' ) {

					texture = new NodeSampledCubeTexture( uniformNode.name, uniformNode.node, group, access );

				} else if ( type === 'texture3D' ) {

					texture = new NodeSampledTexture3D( uniformNode.name, uniformNode.node, group, access );

				}

				texture.store = node.isStorageTextureNode === true;
				texture.setVisibility( gpuShaderStageLib[ shaderStage ] );

				if ( ( shaderStage === 'fragment' || shaderStage === 'compute' ) && this.isUnfilterable( node.value ) === false && texture.store === false ) {

					const sampler = new NodeSampler( `${uniformNode.name}_sampler`, uniformNode.node, group );
					sampler.setVisibility( gpuShaderStageLib[ shaderStage ] );

					bindings.push( sampler, texture );

					uniformGPU = [ sampler, texture ];

				} else {

					bindings.push( texture );

					uniformGPU = [ texture ];

				}

			} else if ( type === 'buffer' || type === 'storageBuffer' || type === 'indirectStorageBuffer' ) {

				const bufferClass = type === 'buffer' ? NodeUniformBuffer : NodeStorageBuffer;

				const buffer = new bufferClass( node, group );
				buffer.setVisibility( gpuShaderStageLib[ shaderStage ] );

				bindings.push( buffer );

				uniformGPU = buffer;

			} else {

				const uniformsStage = this.uniformGroups[ shaderStage ] || ( this.uniformGroups[ shaderStage ] = {} );

				let uniformsGroup = uniformsStage[ groupName ];

				if ( uniformsGroup === undefined ) {

					uniformsGroup = new NodeUniformsGroup( groupName, group );
					uniformsGroup.setVisibility( gpuShaderStageLib[ shaderStage ] );

					uniformsStage[ groupName ] = uniformsGroup;

					bindings.push( uniformsGroup );

				}

				uniformGPU = this.getNodeUniform( uniformNode, type );

				uniformsGroup.addUniform( uniformGPU );

			}

			nodeData.uniformGPU = uniformGPU;

		}

		return uniformNode;

	}

	/**
	 * This method should be used whenever builtins are required in nodes.
	 * The internal builtins data structure will make sure builtins are
	 * defined in the WGSL source.
	 *
	 * @param {String} name - The builtin name.
	 * @param {String} property - The property name.
	 * @param {String} type - The node data type.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} The property name.
	 */
	getBuiltin( name, property, type, shaderStage = this.shaderStage ) {

		const map = this.builtins[ shaderStage ] || ( this.builtins[ shaderStage ] = new Map() );

		if ( map.has( name ) === false ) {

			map.set( name, {
				name,
				property,
				type
			} );

		}

		return property;

	}

	/**
	 * Returns `true` if the given builtin is defined in the given shader stage.
	 *
	 * @param {String} name - The builtin name.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage this code snippet is generated for.
	 * @return {String} Whether the given builtin is defined in the given shader stage or not.
	 */
	hasBuiltin( name, shaderStage = this.shaderStage ) {

		return ( this.builtins[ shaderStage ] !== undefined && this.builtins[ shaderStage ].has( name ) );

	}

	/**
	 * Returns the vertex index builtin.
	 *
	 * @return {String} The vertex index.
	 */
	getVertexIndex() {

		if ( this.shaderStage === 'vertex' ) {

			return this.getBuiltin( 'vertex_index', 'vertexIndex', 'u32', 'attribute' );

		}

		return 'vertexIndex';

	}

	/**
	 * Builds the given shader node.
	 *
	 * @param {ShaderNodeInternal} shaderNode - The shader node.
	 * @return {String} The WGSL function code.
	 */
	buildFunctionCode( shaderNode ) {

		const layout = shaderNode.layout;
		const flowData = this.flowShaderNode( shaderNode );

		const parameters = [];

		for ( const input of layout.inputs ) {

			parameters.push( input.name + ' : ' + this.getType( input.type ) );

		}

		//

		let code = `fn ${ layout.name }( ${ parameters.join( ', ' ) } ) -> ${ this.getType( layout.type ) } {
${ flowData.vars }
${ flowData.code }
`;

		if ( flowData.result ) {

			code += `\treturn ${ flowData.result };\n`;

		}

		code += '\n}\n';

		//

		return code;

	}

	/**
	 * Returns the instance index builtin.
	 *
	 * @return {String} The instance index.
	 */
	getInstanceIndex() {

		if ( this.shaderStage === 'vertex' ) {

			return this.getBuiltin( 'instance_index', 'instanceIndex', 'u32', 'attribute' );

		}

		return 'instanceIndex';

	}

	/**
	 * Returns the invocation local index builtin.
	 *
	 * @return {String} The invocation local index.
	 */
	getInvocationLocalIndex() {

		return this.getBuiltin( 'local_invocation_index', 'invocationLocalIndex', 'u32', 'attribute' );

	}

	/**
	 * Returns the subgroup size builtin.
	 *
	 * @return {String} The subgroup size.
	 */
	getSubgroupSize() {

		this.enableSubGroups();

		return this.getBuiltin( 'subgroup_size', 'subgroupSize', 'u32', 'attribute' );

	}

	/**
	 * Returns the invocation subgroup index builtin.
	 *
	 * @return {String} The invocation subgroup index.
	 */
	getInvocationSubgroupIndex() {

		this.enableSubGroups();

		return this.getBuiltin( 'subgroup_invocation_id', 'invocationSubgroupIndex', 'u32', 'attribute' );

	}

	/**
	 * Returns the subgroup index builtin.
	 *
	 * @return {String} The subgroup index.
	 */
	getSubgroupIndex() {

		this.enableSubGroups();

		return this.getBuiltin( 'subgroup_id', 'subgroupIndex', 'u32', 'attribute' );

	}

	/**
	 * Overwritten as a NOP since this method is intended for the WebGL 2 backend.
	 *
	 * @return {null} Null.
	 */
	getDrawIndex() {

		return null;

	}

	/**
	 * Returns the front facing builtin.
	 *
	 * @return {String} The front facing builtin.
	 */
	getFrontFacing() {

		return this.getBuiltin( 'front_facing', 'isFront', 'bool' );

	}

	/**
	 * Returns the frag coord builtin.
	 *
	 * @return {String} The frag coord builtin.
	 */
	getFragCoord() {

		return this.getBuiltin( 'position', 'fragCoord', 'vec4<f32>' ) + '.xy';

	}

	/**
	 * Returns the frag depth builtin.
	 *
	 * @return {String} The frag depth builtin.
	 */
	getFragDepth() {

		return 'output.' + this.getBuiltin( 'frag_depth', 'depth', 'f32', 'output' );

	}

	/**
	 * Returns the clip distances builtin.
	 *
	 * @return {String} The clip distances builtin.
	 */
	getClipDistance() {

		return 'varyings.hw_clip_distances';

	}

	/**
	 * Whether to flip texture data along its vertical axis or not.
	 *
	 * @return {Boolean} Returns always `false` in context of WGSL.
	 */
	isFlipY() {

		return false;

	}

	/**
	 * Enables the given directive for the given shader stage.
	 *
	 * @param {String} name - The directive name.
	 * @param {String} [shaderStage=this.shaderStage] - The shader stage to enable the directive for.
	 */
	enableDirective( name, shaderStage = this.shaderStage ) {

		const stage = this.directives[ shaderStage ] || ( this.directives[ shaderStage ] = new Set() );
		stage.add( name );

	}

	/**
	 * Returns the directives of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} A WGSL snippet that enables the directives of the given stage.
	 */
	getDirectives( shaderStage ) {

		const snippets = [];
		const directives = this.directives[ shaderStage ];

		if ( directives !== undefined ) {

			for ( const directive of directives ) {

				snippets.push( `enable ${directive};` );

			}

		}

		return snippets.join( '\n' );

	}

	/**
	 * Enables the 'subgroups' directive.
	 */
	enableSubGroups() {

		this.enableDirective( 'subgroups' );

	}

	/**
	 * Enables the 'subgroups-f16' directive.
	 */
	enableSubgroupsF16() {

		this.enableDirective( 'subgroups-f16' );

	}

	/**
	 * Enables the 'clip_distances' directive.
	 */
	enableClipDistances() {

		this.enableDirective( 'clip_distances' );

	}

	/**
	 * Enables the 'f16' directive.
	 */
	enableShaderF16() {

		this.enableDirective( 'f16' );

	}

	/**
	 * Enables the 'dual_source_blending' directive.
	 */
	enableDualSourceBlending() {

		this.enableDirective( 'dual_source_blending' );

	}

	/**
	 * Enables hardware clipping.
	 *
	 * @param {String} planeCount - The clipping plane count.
	 */
	enableHardwareClipping( planeCount ) {

		this.enableClipDistances();
		this.getBuiltin( 'clip_distances', 'hw_clip_distances', `array<f32, ${ planeCount } >`, 'vertex' );

	}

	/**
	 * Returns the builtins of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} A WGSL snippet that represents the builtins of the given stage.
	 */
	getBuiltins( shaderStage ) {

		const snippets = [];
		const builtins = this.builtins[ shaderStage ];

		if ( builtins !== undefined ) {

			for ( const { name, property, type } of builtins.values() ) {

				snippets.push( `@builtin( ${name} ) ${property} : ${type}` );

			}

		}

		return snippets.join( ',\n\t' );

	}

	/**
	 * This method should be used when a new scoped buffer is used in context of
	 * compute shaders. It adds the array to the internal data structure which is
	 * later used to generate the respective WGSL.
	 *
	 * @param {String} name - The array name.
	 * @param {String} scope - The scope.
	 * @param {String} bufferType - The buffer type.
	 * @param {String} bufferCount - The buffer count.
	 * @return {String} The array name.
	 */
	getScopedArray( name, scope, bufferType, bufferCount ) {

		if ( this.scopedArrays.has( name ) === false ) {

			this.scopedArrays.set( name, {
				name,
				scope,
				bufferType,
				bufferCount
			} );

		}

		return name;

	}

	/**
	 * Returns the scoped arrays of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String|undefined} The WGSL snippet that defines the scoped arrays.
	 * Returns `undefined` when used in the vertex or fragment stage.
	 */
	getScopedArrays( shaderStage ) {

		if ( shaderStage !== 'compute' ) {

			return;

		}

		const snippets = [];

		for ( const { name, scope, bufferType, bufferCount } of this.scopedArrays.values() ) {

			const type = this.getType( bufferType );

			snippets.push( `var<${scope}> ${name}: array< ${type}, ${bufferCount} >;` );

		}

		return snippets.join( '\n' );

	}

	/**
	 * Returns the shader attributes of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet that defines the shader attributes.
	 */
	getAttributes( shaderStage ) {

		const snippets = [];

		if ( shaderStage === 'compute' ) {

			this.getBuiltin( 'global_invocation_id', 'id', 'vec3<u32>', 'attribute' );
			this.getBuiltin( 'workgroup_id', 'workgroupId', 'vec3<u32>', 'attribute' );
			this.getBuiltin( 'local_invocation_id', 'localId', 'vec3<u32>', 'attribute' );
			this.getBuiltin( 'num_workgroups', 'numWorkgroups', 'vec3<u32>', 'attribute' );

			if ( this.renderer.hasFeature( 'subgroups' ) ) {

				this.enableDirective( 'subgroups', shaderStage );
				this.getBuiltin( 'subgroup_size', 'subgroupSize', 'u32', 'attribute' );

			}

		}

		if ( shaderStage === 'vertex' || shaderStage === 'compute' ) {

			const builtins = this.getBuiltins( 'attribute' );

			if ( builtins ) snippets.push( builtins );

			const attributes = this.getAttributesArray();

			for ( let index = 0, length = attributes.length; index < length; index ++ ) {

				const attribute = attributes[ index ];
				const name = attribute.name;
				const type = this.getType( attribute.type );

				snippets.push( `@location( ${index} ) ${ name } : ${ type }` );

			}

		}

		return snippets.join( ',\n\t' );

	}

	/**
	 * Returns the members of the given struct type node as a WGSL string.
	 *
	 * @param {StructTypeNode} struct - The struct type node.
	 * @return {String} The WGSL snippet that defines the struct members.
	 */
	getStructMembers( struct ) {

		const snippets = [];
		const members = struct.getMemberTypes();

		for ( let i = 0; i < members.length; i ++ ) {

			const member = members[ i ];
			snippets.push( `\t@location( ${i} ) m${i} : ${ member }<f32>` );

		}

		const builtins = this.getBuiltins( 'output' );

		if ( builtins ) snippets.push( '\t' + builtins );

		return snippets.join( ',\n' );

	}

	/**
	 * Returns the structs of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet that defines the structs.
	 */
	getStructs( shaderStage ) {

		const snippets = [];
		const structs = this.structs[ shaderStage ];

		for ( let index = 0, length = structs.length; index < length; index ++ ) {

			const struct = structs[ index ];
			const name = struct.name;

			let snippet = `\struct ${ name } {\n`;
			snippet += this.getStructMembers( struct );
			snippet += '\n}';


			snippets.push( snippet );

			snippets.push( `\nvar<private> output : ${ name };\n\n` );

		}

		return snippets.join( '\n\n' );

	}

	/**
	 * Returns a WGSL string representing a variable.
	 *
	 * @param {String} type - The variable's type.
	 * @param {String} name - The variable's name.
	 * @return {String} The WGSL snippet that defines a variable.
	 */
	getVar( type, name ) {

		return `var ${ name } : ${ this.getType( type ) }`;

	}

	/**
	 * Returns the variables of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet that defines the variables.
	 */
	getVars( shaderStage ) {

		const snippets = [];
		const vars = this.vars[ shaderStage ];

		if ( vars !== undefined ) {

			for ( const variable of vars ) {

				snippets.push( `\t${ this.getVar( variable.type, variable.name ) };` );

			}

		}

		return `\n${ snippets.join( '\n' ) }\n`;

	}

	/**
	 * Returns the varyings of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet that defines the varyings.
	 */
	getVaryings( shaderStage ) {

		const snippets = [];

		if ( shaderStage === 'vertex' ) {

			this.getBuiltin( 'position', 'Vertex', 'vec4<f32>', 'vertex' );

		}

		if ( shaderStage === 'vertex' || shaderStage === 'fragment' ) {

			const varyings = this.varyings;
			const vars = this.vars[ shaderStage ];

			for ( let index = 0; index < varyings.length; index ++ ) {

				const varying = varyings[ index ];

				if ( varying.needsInterpolation ) {

					let attributesSnippet = `@location( ${index} )`;

					if ( /^(int|uint|ivec|uvec)/.test( varying.type ) ) {

						attributesSnippet += ' @interpolate( flat )';


					}

					snippets.push( `${ attributesSnippet } ${ varying.name } : ${ this.getType( varying.type ) }` );

				} else if ( shaderStage === 'vertex' && vars.includes( varying ) === false ) {

					vars.push( varying );

				}

			}

		}

		const builtins = this.getBuiltins( shaderStage );

		if ( builtins ) snippets.push( builtins );

		const code = snippets.join( ',\n\t' );

		return shaderStage === 'vertex' ? this._getWGSLStruct( 'VaryingsStruct', '\t' + code ) : code;

	}

	/**
	 * Returns the uniforms of the given shader stage as a WGSL string.
	 *
	 * @param {String} shaderStage - The shader stage.
	 * @return {String} The WGSL snippet that defines the uniforms.
	 */
	getUniforms( shaderStage ) {

		const uniforms = this.uniforms[ shaderStage ];

		const bindingSnippets = [];
		const bufferSnippets = [];
		const structSnippets = [];
		const uniformGroups = {};

		for ( const uniform of uniforms ) {

			const groupName = uniform.groupNode.name;
			const uniformIndexes = this.bindingsIndexes[ groupName ];

			if ( uniform.type === 'texture' || uniform.type === 'cubeTexture' || uniform.type === 'storageTexture' || uniform.type === 'texture3D' ) {

				const texture = uniform.node.value;

				if ( ( shaderStage === 'fragment' || shaderStage === 'compute' ) && this.isUnfilterable( texture ) === false && uniform.node.isStorageTextureNode !== true ) {

					if ( this.isSampleCompare( texture ) ) {

						bindingSnippets.push( `@binding( ${ uniformIndexes.binding ++ } ) @group( ${ uniformIndexes.group } ) var ${ uniform.name }_sampler : sampler_comparison;` );

					} else {

						bindingSnippets.push( `@binding( ${ uniformIndexes.binding ++ } ) @group( ${ uniformIndexes.group } ) var ${ uniform.name }_sampler : sampler;` );

					}

				}

				let textureType;

				let multisampled = '';

				const { primarySamples } = this.renderer.backend.utils.getTextureSampleData( texture );

				if ( primarySamples > 1 ) {

					multisampled = '_multisampled';

				}

				if ( texture.isCubeTexture === true ) {

					textureType = 'texture_cube<f32>';

				} else if ( texture.isDataArrayTexture === true || texture.isCompressedArrayTexture === true ) {

					textureType = 'texture_2d_array<f32>';

				} else if ( texture.isDepthTexture === true ) {

					textureType = `texture_depth${multisampled}_2d`;

				} else if ( texture.isVideoTexture === true ) {

					textureType = 'texture_external';

				} else if ( texture.isData3DTexture === true ) {

					textureType = 'texture_3d<f32>';

				} else if ( uniform.node.isStorageTextureNode === true ) {

					const format = getFormat( texture );
					const access = this.getStorageAccess( uniform.node, shaderStage );

					textureType = `texture_storage_2d<${ format }, ${ access }>`;

				} else {

					const componentPrefix = this.getComponentTypeFromTexture( texture ).charAt( 0 );

					textureType = `texture${multisampled}_2d<${ componentPrefix }32>`;

				}

				bindingSnippets.push( `@binding( ${ uniformIndexes.binding ++ } ) @group( ${ uniformIndexes.group } ) var ${ uniform.name } : ${ textureType };` );

			} else if ( uniform.type === 'buffer' || uniform.type === 'storageBuffer' || uniform.type === 'indirectStorageBuffer' ) {

				const bufferNode = uniform.node;
				const bufferType = this.getType( bufferNode.bufferType );
				const bufferCount = bufferNode.bufferCount;

				const bufferCountSnippet = bufferCount > 0 && uniform.type === 'buffer' ? ', ' + bufferCount : '';
				const bufferTypeSnippet = bufferNode.isAtomic ? `atomic<${bufferType}>` : `${bufferType}`;
				const bufferSnippet = `\t${ uniform.name } : array< ${ bufferTypeSnippet }${ bufferCountSnippet } >\n`;
				const bufferAccessMode = bufferNode.isStorageBufferNode ? `storage, ${ this.getStorageAccess( bufferNode, shaderStage ) }` : 'uniform';

				bufferSnippets.push( this._getWGSLStructBinding( 'NodeBuffer_' + bufferNode.id, bufferSnippet, bufferAccessMode, uniformIndexes.binding ++, uniformIndexes.group ) );

			} else {

				const vectorType = this.getType( this.getVectorType( uniform.type ) );
				const groupName = uniform.groupNode.name;

				const group = uniformGroups[ groupName ] || ( uniformGroups[ groupName ] = {
					index: uniformIndexes.binding ++,
					id: uniformIndexes.group,
					snippets: []
				} );

				group.snippets.push( `\t${ uniform.name } : ${ vectorType }` );

			}

		}

		for ( const name in uniformGroups ) {

			const group = uniformGroups[ name ];

			structSnippets.push( this._getWGSLStructBinding( name, group.snippets.join( ',\n' ), 'uniform', group.index, group.id ) );

		}

		let code = bindingSnippets.join( '\n' );
		code += bufferSnippets.join( '\n' );
		code += structSnippets.join( '\n' );

		return code;

	}

	/**
	 * Controls the code build of the shader stages.
	 */
	buildCode() {

		const shadersData = this.material !== null ? { fragment: {}, vertex: {} } : { compute: {} };

		this.sortBindingGroups();

		for ( const shaderStage in shadersData ) {

			const stageData = shadersData[ shaderStage ];
			stageData.uniforms = this.getUniforms( shaderStage );
			stageData.attributes = this.getAttributes( shaderStage );
			stageData.varyings = this.getVaryings( shaderStage );
			stageData.structs = this.getStructs( shaderStage );
			stageData.vars = this.getVars( shaderStage );
			stageData.codes = this.getCodes( shaderStage );
			stageData.directives = this.getDirectives( shaderStage );
			stageData.scopedArrays = this.getScopedArrays( shaderStage );

			//

			let flow = '// code\n\n';
			flow += this.flowCode[ shaderStage ];

			const flowNodes = this.flowNodes[ shaderStage ];
			const mainNode = flowNodes[ flowNodes.length - 1 ];

			const outputNode = mainNode.outputNode;
			const isOutputStruct = ( outputNode !== undefined && outputNode.isOutputStructNode === true );

			for ( const node of flowNodes ) {

				const flowSlotData = this.getFlowData( node/*, shaderStage*/ );
				const slotName = node.name;

				if ( slotName ) {

					if ( flow.length > 0 ) flow += '\n';

					flow += `\t// flow -> ${ slotName }\n\t`;

				}

				flow += `${ flowSlotData.code }\n\t`;

				if ( node === mainNode && shaderStage !== 'compute' ) {

					flow += '// result\n\n\t';

					if ( shaderStage === 'vertex' ) {

						flow += `varyings.Vertex = ${ flowSlotData.result };`;

					} else if ( shaderStage === 'fragment' ) {

						if ( isOutputStruct ) {

							stageData.returnType = outputNode.nodeType;

							flow += `return ${ flowSlotData.result };`;

						} else {

							let structSnippet = '\t@location(0) color: vec4<f32>';

							const builtins = this.getBuiltins( 'output' );

							if ( builtins ) structSnippet += ',\n\t' + builtins;

							stageData.returnType = 'OutputStruct';
							stageData.structs += this._getWGSLStruct( 'OutputStruct', structSnippet );
							stageData.structs += '\nvar<private> output : OutputStruct;\n\n';

							flow += `output.color = ${ flowSlotData.result };\n\n\treturn output;`;

						}

					}

				}

			}

			stageData.flow = flow;


		}

		if ( this.material !== null ) {

			this.vertexShader = this._getWGSLVertexCode( shadersData.vertex );
			this.fragmentShader = this._getWGSLFragmentCode( shadersData.fragment );

		} else {

			this.computeShader = this._getWGSLComputeCode( shadersData.compute, ( this.object.workgroupSize || [ 64 ] ).join( ', ' ) );

		}

	}

	/**
	 * Returns the native shader method name for a given generic name.
	 *
	 * @param {String} method - The method name to resolve.
	 * @param {String} [output=null] - An optional output.
	 * @return {String} The resolved WGSL method name.
	 */
	getMethod( method, output = null ) {

		let wgslMethod;

		if ( output !== null ) {

			wgslMethod = this._getWGSLMethod( method + '_' + output );

		}

		if ( wgslMethod === undefined ) {

			wgslMethod = this._getWGSLMethod( method );

		}

		return wgslMethod || method;

	}

	/**
	 * Returns the WGSL type of the given node data type.
	 *
	 * @param {String} type - The node data type.
	 * @return {String} The WGSL type.
	 */
	getType( type ) {

		return wgslTypeLib[ type ] || type;

	}

	/**
	 * Whether the requested feature is available or not.
	 *
	 * @param {String} name - The requested feature.
	 * @return {Boolean} Whether the requested feature is supported or not.
	 */
	isAvailable( name ) {

		let result = supports[ name ];

		if ( result === undefined ) {

			if ( name === 'float32Filterable' ) {

				result = this.renderer.hasFeature( 'float32-filterable' );

			} else if ( name === 'clipDistance' ) {

				result = this.renderer.hasFeature( 'clip-distances' );

			}

			supports[ name ] = result;

		}

		return result;

	}

	/**
	 * Returns the native shader method name for a given generic name.
	 *
	 * @private
	 * @param {String} method - The method name to resolve.
	 * @return {String} The resolved WGSL method name.
	 */
	_getWGSLMethod( method ) {

		if ( wgslPolyfill[ method ] !== undefined ) {

			this._include( method );

		}

		return wgslMethods[ method ];

	}

	/**
	 * Includes the given method name into the current
	 * function node.
	 *
	 * @private
	 * @param {String} name - The method name to include.
	 * @return {CodeNode} The respective code node.
	 */
	_include( name ) {

		const codeNode = wgslPolyfill[ name ];
		codeNode.build( this );

		if ( this.currentFunctionNode !== null ) {

			this.currentFunctionNode.includes.push( codeNode );

		}

		return codeNode;

	}

	/**
	 * Returns a WGSL vertex shader based on the given shader data.
	 *
	 * @private
	 * @param {Object} shaderData - The shader data.
	 * @return {String} The vertex shader.
	 */
	_getWGSLVertexCode( shaderData ) {

		return `${ this.getSignature() }
// directives
${shaderData.directives}

// uniforms
${shaderData.uniforms}

// varyings
${shaderData.varyings}
var<private> varyings : VaryingsStruct;

// codes
${shaderData.codes}

@vertex
fn main( ${shaderData.attributes} ) -> VaryingsStruct {

	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}

	return varyings;

}
`;

	}

	/**
	 * Returns a WGSL fragment shader based on the given shader data.
	 *
	 * @private
	 * @param {Object} shaderData - The shader data.
	 * @return {String} The vertex shader.
	 */
	_getWGSLFragmentCode( shaderData ) {

		return `${ this.getSignature() }
// global
${ diagnostics }

// uniforms
${shaderData.uniforms}

// structs
${shaderData.structs}

// codes
${shaderData.codes}

@fragment
fn main( ${shaderData.varyings} ) -> ${shaderData.returnType} {

	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}

}
`;

	}

	/**
	 * Returns a WGSL compute shader based on the given shader data.
	 *
	 * @private
	 * @param {Object} shaderData - The shader data.
	 * @param {String} workgroupSize - The workgroup size.
	 * @return {String} The vertex shader.
	 */
	_getWGSLComputeCode( shaderData, workgroupSize ) {

		return `${ this.getSignature() }
// directives
${shaderData.directives}

// system
var<private> instanceIndex : u32;

// locals
${shaderData.scopedArrays}

// uniforms
${shaderData.uniforms}

// codes
${shaderData.codes}

@compute @workgroup_size( ${workgroupSize} )
fn main( ${shaderData.attributes} ) {

	// system
	instanceIndex = id.x + id.y * numWorkgroups.x * u32(${workgroupSize}) + id.z * numWorkgroups.x * numWorkgroups.y * u32(${workgroupSize});

	// vars
	${shaderData.vars}

	// flow
	${shaderData.flow}

}
`;

	}

	/**
	 * Returns a WGSL struct based on the given name and variables.
	 *
	 * @private
	 * @param {String} name - The struct name.
	 * @param {String} vars - The struct variables.
	 * @return {String} The WGSL snippet representing a struct.
	 */
	_getWGSLStruct( name, vars ) {

		return `
struct ${name} {
${vars}
};`;

	}

	/**
	 * Returns a WGSL struct binding.
	 *
	 * @private
	 * @param {String} name - The struct name.
	 * @param {String} vars - The struct variables.
	 * @param {String} access - The access.
	 * @param {Number} [binding=0] - The binding index.
	 * @param {Number} [group=0] - The group index.
	 * @return {String} The WGSL snippet representing a struct binding.
	 */
	_getWGSLStructBinding( name, vars, access, binding = 0, group = 0 ) {

		const structName = name + 'Struct';
		const structSnippet = this._getWGSLStruct( structName, vars );

		return `${structSnippet}
@binding( ${binding} ) @group( ${group} )
var<${access}> ${name} : ${structName};`;

	}

}

export default WGSLNodeBuilder;
