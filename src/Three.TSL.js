import { TSL } from 'three/webgpu';

export const BRDF_GGX = TSL.BRDF_GGX;
export const BRDF_Lambert = TSL.BRDF_Lambert;
export const BasicShadowFilter = TSL.BasicShadowFilter;
export const Break = TSL.Break;
export const Continue = TSL.Continue;
export const DFGApprox = TSL.DFGApprox;
export const D_GGX = TSL.D_GGX;
export const Discard = TSL.Discard;
export const EPSILON = TSL.EPSILON;
export const F_Schlick = TSL.F_Schlick;
export const Fn = TSL.Fn;
export const INFINITY = TSL.INFINITY;
export const If = TSL.If;
export const Loop = TSL.Loop;
export const NodeShaderStage = TSL.NodeShaderStage;
export const NodeType = TSL.NodeType;
export const NodeUpdateType = TSL.NodeUpdateType;
export const NodeAccess = TSL.NodeAccess;
export const PCFShadowFilter = TSL.PCFShadowFilter;
export const PCFSoftShadowFilter = TSL.PCFSoftShadowFilter;
export const PI = TSL.PI;
export const PI2 = TSL.PI2;
export const Return = TSL.Return;
export const Schlick_to_F0 = TSL.Schlick_to_F0;
export const ScriptableNodeResources = TSL.ScriptableNodeResources;
export const ShaderNode = TSL.ShaderNode;
export const TBNViewMatrix = TSL.TBNViewMatrix;
export const VSMShadowFilter = TSL.VSMShadowFilter;
export const V_GGX_SmithCorrelated = TSL.V_GGX_SmithCorrelated;
export const abs = TSL.abs;
export const acesFilmicToneMapping = TSL.acesFilmicToneMapping;
export const acos = TSL.acos;
export const add = TSL.add;
export const addMethodChaining = TSL.addMethodChaining;
export const addNodeElement = TSL.addNodeElement;
export const agxToneMapping = TSL.agxToneMapping;
export const all = TSL.all;
export const alphaT = TSL.alphaT;
export const and = TSL.and;
export const anisotropy = TSL.anisotropy;
export const anisotropyB = TSL.anisotropyB;
export const anisotropyT = TSL.anisotropyT;
export const any = TSL.any;
export const append = TSL.append;
export const arrayBuffer = TSL.arrayBuffer;
export const asin = TSL.asin;
export const assign = TSL.assign;
export const atan = TSL.atan;
export const atan2 = TSL.atan2;
export const atomicAdd = TSL.atomicAdd;
export const atomicAnd = TSL.atomicAnd;
export const atomicFunc = TSL.atomicFunc;
export const atomicMax = TSL.atomicMax;
export const atomicMin = TSL.atomicMin;
export const atomicOr = TSL.atomicOr;
export const atomicStore = TSL.atomicStore;
export const atomicSub = TSL.atomicSub;
export const atomicXor = TSL.atomicXor;
export const attenuationColor = TSL.attenuationColor;
export const attenuationDistance = TSL.attenuationDistance;
export const attribute = TSL.attribute;
export const attributeArray = TSL.attributeArray;
export const backgroundBlurriness = TSL.backgroundBlurriness;
export const backgroundIntensity = TSL.backgroundIntensity;
export const backgroundRotation = TSL.backgroundRotation;
export const batch = TSL.batch;
export const billboarding = TSL.billboarding;
export const bitAnd = TSL.bitAnd;
export const bitNot = TSL.bitNot;
export const bitOr = TSL.bitOr;
export const bitXor = TSL.bitXor;
export const bitangentGeometry = TSL.bitangentGeometry;
export const bitangentLocal = TSL.bitangentLocal;
export const bitangentView = TSL.bitangentView;
export const bitangentWorld = TSL.bitangentWorld;
export const bitcast = TSL.bitcast;
export const blendBurn = TSL.blendBurn;
export const blendColor = TSL.blendColor;
export const blendDodge = TSL.blendDodge;
export const blendOverlay = TSL.blendOverlay;
export const blendScreen = TSL.blendScreen;
export const blur = TSL.blur;
export const bool = TSL.bool;
export const buffer = TSL.buffer;
export const bufferAttribute = TSL.bufferAttribute;
export const bumpMap = TSL.bumpMap;
export const burn = TSL.burn;
export const bvec2 = TSL.bvec2;
export const bvec3 = TSL.bvec3;
export const bvec4 = TSL.bvec4;
export const bypass = TSL.bypass;
export const cache = TSL.cache;
export const call = TSL.call;
export const cameraFar = TSL.cameraFar;
export const cameraNear = TSL.cameraNear;
export const cameraNormalMatrix = TSL.cameraNormalMatrix;
export const cameraPosition = TSL.cameraPosition;
export const cameraProjectionMatrix = TSL.cameraProjectionMatrix;
export const cameraProjectionMatrixInverse = TSL.cameraProjectionMatrixInverse;
export const cameraViewMatrix = TSL.cameraViewMatrix;
export const cameraWorldMatrix = TSL.cameraWorldMatrix;
export const cbrt = TSL.cbrt;
export const cdl = TSL.cdl;
export const ceil = TSL.ceil;
export const checker = TSL.checker;
export const cineonToneMapping = TSL.cineonToneMapping;
export const clamp = TSL.clamp;
export const clearcoat = TSL.clearcoat;
export const clearcoatRoughness = TSL.clearcoatRoughness;
export const code = TSL.code;
export const color = TSL.color;
export const colorSpaceToWorking = TSL.colorSpaceToWorking;
export const colorToDirection = TSL.colorToDirection;
export const compute = TSL.compute;
export const cond = TSL.cond;
export const context = TSL.context;
export const convert = TSL.convert;
export const convertColorSpace = TSL.convertColorSpace;
export const convertToTexture = TSL.convertToTexture;
export const cos = TSL.cos;
export const cross = TSL.cross;
export const cubeTexture = TSL.cubeTexture;
export const dFdx = TSL.dFdx;
export const dFdy = TSL.dFdy;
export const dashSize = TSL.dashSize;
export const defaultBuildStages = TSL.defaultBuildStages;
export const defaultShaderStages = TSL.defaultShaderStages;
export const defined = TSL.defined;
export const degrees = TSL.degrees;
export const deltaTime = TSL.deltaTime;
export const densityFog = TSL.densityFog;
export const densityFogFactor = TSL.densityFogFactor;
export const depth = TSL.depth;
export const depthPass = TSL.depthPass;
export const difference = TSL.difference;
export const diffuseColor = TSL.diffuseColor;
export const directPointLight = TSL.directPointLight;
export const directionToColor = TSL.directionToColor;
export const dispersion = TSL.dispersion;
export const distance = TSL.distance;
export const div = TSL.div;
export const dodge = TSL.dodge;
export const dot = TSL.dot;
export const drawIndex = TSL.drawIndex;
export const dynamicBufferAttribute = TSL.dynamicBufferAttribute;
export const element = TSL.element;
export const emissive = TSL.emissive;
export const equal = TSL.equal;
export const equals = TSL.equals;
export const equirectUV = TSL.equirectUV;
export const exp = TSL.exp;
export const exp2 = TSL.exp2;
export const expression = TSL.expression;
export const faceDirection = TSL.faceDirection;
export const faceForward = TSL.faceForward;
export const float = TSL.float;
export const floor = TSL.floor;
export const fog = TSL.fog;
export const fract = TSL.fract;
export const frameGroup = TSL.frameGroup;
export const frameId = TSL.frameId;
export const frontFacing = TSL.frontFacing;
export const fwidth = TSL.fwidth;
export const gain = TSL.gain;
export const gapSize = TSL.gapSize;
export const getConstNodeType = TSL.getConstNodeType;
export const getCurrentStack = TSL.getCurrentStack;
export const getDirection = TSL.getDirection;
export const getDistanceAttenuation = TSL.getDistanceAttenuation;
export const getGeometryRoughness = TSL.getGeometryRoughness;
export const getNormalFromDepth = TSL.getNormalFromDepth;
export const getParallaxCorrectNormal = TSL.getParallaxCorrectNormal;
export const getRoughness = TSL.getRoughness;
export const getScreenPosition = TSL.getScreenPosition;
export const getShIrradianceAt = TSL.getShIrradianceAt;
export const getTextureIndex = TSL.getTextureIndex;
export const getViewPosition = TSL.getViewPosition;
export const glsl = TSL.glsl;
export const glslFn = TSL.glslFn;
export const grayscale = TSL.grayscale;
export const greaterThan = TSL.greaterThan;
export const greaterThanEqual = TSL.greaterThanEqual;
export const hash = TSL.hash;
export const highpModelNormalViewMatrix = TSL.highpModelNormalViewMatrix;
export const highpModelViewMatrix = TSL.highpModelViewMatrix;
export const hue = TSL.hue;
export const instance = TSL.instance;
export const instanceIndex = TSL.instanceIndex;
export const instancedArray = TSL.instancedArray;
export const instancedBufferAttribute = TSL.instancedBufferAttribute;
export const instancedDynamicBufferAttribute = TSL.instancedDynamicBufferAttribute;
export const instancedMesh = TSL.instancedMesh;
export const int = TSL.int;
export const inverseSqrt = TSL.inverseSqrt;
export const invocationLocalIndex = TSL.invocationLocalIndex;
export const invocationSubgroupIndex = TSL.invocationSubgroupIndex;
export const ior = TSL.ior;
export const iridescence = TSL.iridescence;
export const iridescenceIOR = TSL.iridescenceIOR;
export const iridescenceThickness = TSL.iridescenceThickness;
export const ivec2 = TSL.ivec2;
export const ivec3 = TSL.ivec3;
export const ivec4 = TSL.ivec4;
export const js = TSL.js;
export const label = TSL.label;
export const length = TSL.length;
export const lengthSq = TSL.lengthSq;
export const lessThan = TSL.lessThan;
export const lessThanEqual = TSL.lessThanEqual;
export const lightPosition = TSL.lightPosition;
export const lightTargetDirection = TSL.lightTargetDirection;
export const lightTargetPosition = TSL.lightTargetPosition;
export const lightViewPosition = TSL.lightViewPosition;
export const lightingContext = TSL.lightingContext;
export const lights = TSL.lights;
export const linearDepth = TSL.linearDepth;
export const linearToneMapping = TSL.linearToneMapping;
export const localId = TSL.localId;
export const log = TSL.log;
export const log2 = TSL.log2;
export const logarithmicDepthToViewZ = TSL.logarithmicDepthToViewZ;
export const loop = TSL.loop;
export const luminance = TSL.luminance;
export const mediumpModelViewMatrix = TSL.mediumpModelViewMatrix;
export const mat2 = TSL.mat2;
export const mat3 = TSL.mat3;
export const mat4 = TSL.mat4;
export const matcapUV = TSL.matcapUV;
export const materialAOMap = TSL.materialAOMap;
export const materialAlphaTest = TSL.materialAlphaTest;
export const materialAnisotropy = TSL.materialAnisotropy;
export const materialAnisotropyVector = TSL.materialAnisotropyVector;
export const materialAttenuationColor = TSL.materialAttenuationColor;
export const materialAttenuationDistance = TSL.materialAttenuationDistance;
export const materialClearcoat = TSL.materialClearcoat;
export const materialClearcoatNormal = TSL.materialClearcoatNormal;
export const materialClearcoatRoughness = TSL.materialClearcoatRoughness;
export const materialColor = TSL.materialColor;
export const materialDispersion = TSL.materialDispersion;
export const materialEmissive = TSL.materialEmissive;
export const materialIOR = TSL.materialIOR;
export const materialIridescence = TSL.materialIridescence;
export const materialIridescenceIOR = TSL.materialIridescenceIOR;
export const materialIridescenceThickness = TSL.materialIridescenceThickness;
export const materialLightMap = TSL.materialLightMap;
export const materialLineDashOffset = TSL.materialLineDashOffset;
export const materialLineDashSize = TSL.materialLineDashSize;
export const materialLineGapSize = TSL.materialLineGapSize;
export const materialLineScale = TSL.materialLineScale;
export const materialLineWidth = TSL.materialLineWidth;
export const materialMetalness = TSL.materialMetalness;
export const materialNormal = TSL.materialNormal;
export const materialOpacity = TSL.materialOpacity;
export const materialPointWidth = TSL.materialPointWidth;
export const materialReference = TSL.materialReference;
export const materialReflectivity = TSL.materialReflectivity;
export const materialRefractionRatio = TSL.materialRefractionRatio;
export const materialRotation = TSL.materialRotation;
export const materialRoughness = TSL.materialRoughness;
export const materialSheen = TSL.materialSheen;
export const materialSheenRoughness = TSL.materialSheenRoughness;
export const materialShininess = TSL.materialShininess;
export const materialSpecular = TSL.materialSpecular;
export const materialSpecularColor = TSL.materialSpecularColor;
export const materialSpecularIntensity = TSL.materialSpecularIntensity;
export const materialSpecularStrength = TSL.materialSpecularStrength;
export const materialThickness = TSL.materialThickness;
export const materialTransmission = TSL.materialTransmission;
export const max = TSL.max;
export const maxMipLevel = TSL.maxMipLevel;
export const metalness = TSL.metalness;
export const min = TSL.min;
export const mix = TSL.mix;
export const mixElement = TSL.mixElement;
export const mod = TSL.mod;
export const modInt = TSL.modInt;
export const modelDirection = TSL.modelDirection;
export const modelNormalMatrix = TSL.modelNormalMatrix;
export const modelPosition = TSL.modelPosition;
export const modelScale = TSL.modelScale;
export const modelViewMatrix = TSL.modelViewMatrix;
export const modelViewPosition = TSL.modelViewPosition;
export const modelViewProjection = TSL.modelViewProjection;
export const modelWorldMatrix = TSL.modelWorldMatrix;
export const modelWorldMatrixInverse = TSL.modelWorldMatrixInverse;
export const morphReference = TSL.morphReference;
export const mrt = TSL.mrt;
export const mul = TSL.mul;
export const mx_aastep = TSL.mx_aastep;
export const mx_cell_noise_float = TSL.mx_cell_noise_float;
export const mx_contrast = TSL.mx_contrast;
export const mx_fractal_noise_float = TSL.mx_fractal_noise_float;
export const mx_fractal_noise_vec2 = TSL.mx_fractal_noise_vec2;
export const mx_fractal_noise_vec3 = TSL.mx_fractal_noise_vec3;
export const mx_fractal_noise_vec4 = TSL.mx_fractal_noise_vec4;
export const mx_hsvtorgb = TSL.mx_hsvtorgb;
export const mx_noise_float = TSL.mx_noise_float;
export const mx_noise_vec3 = TSL.mx_noise_vec3;
export const mx_noise_vec4 = TSL.mx_noise_vec4;
export const mx_ramplr = TSL.mx_ramplr;
export const mx_ramptb = TSL.mx_ramptb;
export const mx_rgbtohsv = TSL.mx_rgbtohsv;
export const mx_safepower = TSL.mx_safepower;
export const mx_splitlr = TSL.mx_splitlr;
export const mx_splittb = TSL.mx_splittb;
export const mx_srgb_texture_to_lin_rec709 = TSL.mx_srgb_texture_to_lin_rec709;
export const mx_transform_uv = TSL.mx_transform_uv;
export const mx_worley_noise_float = TSL.mx_worley_noise_float;
export const mx_worley_noise_vec2 = TSL.mx_worley_noise_vec2;
export const mx_worley_noise_vec3 = TSL.mx_worley_noise_vec3;
export const negate = TSL.negate;
export const neutralToneMapping = TSL.neutralToneMapping;
export const nodeArray = TSL.nodeArray;
export const nodeImmutable = TSL.nodeImmutable;
export const nodeObject = TSL.nodeObject;
export const nodeObjects = TSL.nodeObjects;
export const nodeProxy = TSL.nodeProxy;
export const normalFlat = TSL.normalFlat;
export const normalGeometry = TSL.normalGeometry;
export const normalLocal = TSL.normalLocal;
export const normalMap = TSL.normalMap;
export const normalView = TSL.normalView;
export const normalWorld = TSL.normalWorld;
export const normalize = TSL.normalize;
export const not = TSL.not;
export const notEqual = TSL.notEqual;
export const numWorkgroups = TSL.numWorkgroups;
export const objectDirection = TSL.objectDirection;
export const objectGroup = TSL.objectGroup;
export const objectPosition = TSL.objectPosition;
export const objectScale = TSL.objectScale;
export const objectViewPosition = TSL.objectViewPosition;
export const objectWorldMatrix = TSL.objectWorldMatrix;
export const oneMinus = TSL.oneMinus;
export const or = TSL.or;
export const orthographicDepthToViewZ = TSL.orthographicDepthToViewZ;
export const oscSawtooth = TSL.oscSawtooth;
export const oscSine = TSL.oscSine;
export const oscSquare = TSL.oscSquare;
export const oscTriangle = TSL.oscTriangle;
export const output = TSL.output;
export const outputStruct = TSL.outputStruct;
export const overlay = TSL.overlay;
export const overloadingFn = TSL.overloadingFn;
export const parabola = TSL.parabola;
export const parallaxDirection = TSL.parallaxDirection;
export const parallaxUV = TSL.parallaxUV;
export const parameter = TSL.parameter;
export const pass = TSL.pass;
export const passTexture = TSL.passTexture;
export const pcurve = TSL.pcurve;
export const perspectiveDepthToViewZ = TSL.perspectiveDepthToViewZ;
export const pmremTexture = TSL.pmremTexture;
export const pointUV = TSL.pointUV;
export const pointWidth = TSL.pointWidth;
export const positionGeometry = TSL.positionGeometry;
export const positionLocal = TSL.positionLocal;
export const positionPrevious = TSL.positionPrevious;
export const positionView = TSL.positionView;
export const positionViewDirection = TSL.positionViewDirection;
export const positionWorld = TSL.positionWorld;
export const positionWorldDirection = TSL.positionWorldDirection;
export const posterize = TSL.posterize;
export const pow = TSL.pow;
export const pow2 = TSL.pow2;
export const pow3 = TSL.pow3;
export const pow4 = TSL.pow4;
export const property = TSL.property;
export const radians = TSL.radians;
export const rand = TSL.rand;
export const range = TSL.range;
export const rangeFog = TSL.rangeFog;
export const rangeFogFactor = TSL.rangeFogFactor;
export const reciprocal = TSL.reciprocal;
export const reference = TSL.reference;
export const referenceBuffer = TSL.referenceBuffer;
export const reflect = TSL.reflect;
export const reflectVector = TSL.reflectVector;
export const reflectView = TSL.reflectView;
export const reflector = TSL.reflector;
export const refract = TSL.refract;
export const refractVector = TSL.refractVector;
export const refractView = TSL.refractView;
export const reinhardToneMapping = TSL.reinhardToneMapping;
export const remainder = TSL.remainder;
export const remap = TSL.remap;
export const remapClamp = TSL.remapClamp;
export const renderGroup = TSL.renderGroup;
export const renderOutput = TSL.renderOutput;
export const rendererReference = TSL.rendererReference;
export const rotate = TSL.rotate;
export const rotateUV = TSL.rotateUV;
export const roughness = TSL.roughness;
export const round = TSL.round;
export const rtt = TSL.rtt;
export const sRGBTransferEOTF = TSL.sRGBTransferEOTF;
export const sRGBTransferOETF = TSL.sRGBTransferOETF;
export const sampler = TSL.sampler;
export const saturate = TSL.saturate;
export const saturation = TSL.saturation;
export const screen = TSL.screen;
export const screenCoordinate = TSL.screenCoordinate;
export const screenSize = TSL.screenSize;
export const screenUV = TSL.screenUV;
export const scriptable = TSL.scriptable;
export const scriptableValue = TSL.scriptableValue;
export const select = TSL.select;
export const setCurrentStack = TSL.setCurrentStack;
export const shaderStages = TSL.shaderStages;
export const shadow = TSL.shadow;
export const shadowWorldPosition = TSL.shadowWorldPosition;
export const sharedUniformGroup = TSL.sharedUniformGroup;
export const sheen = TSL.sheen;
export const sheenRoughness = TSL.sheenRoughness;
export const shiftLeft = TSL.shiftLeft;
export const shiftRight = TSL.shiftRight;
export const shininess = TSL.shininess;
export const sign = TSL.sign;
export const sin = TSL.sin;
export const sinc = TSL.sinc;
export const skinning = TSL.skinning;
export const skinningReference = TSL.skinningReference;
export const smoothstep = TSL.smoothstep;
export const smoothstepElement = TSL.smoothstepElement;
export const specularColor = TSL.specularColor;
export const specularF90 = TSL.specularF90;
export const spherizeUV = TSL.spherizeUV;
export const split = TSL.split;
export const spritesheetUV = TSL.spritesheetUV;
export const sqrt = TSL.sqrt;
export const stack = TSL.stack;
export const step = TSL.step;
export const storage = TSL.storage;
export const storageBarrier = TSL.storageBarrier;
export const storageObject = TSL.storageObject;
export const storageTexture = TSL.storageTexture;
export const string = TSL.string;
export const sub = TSL.sub;
export const subgroupIndex = TSL.subgroupIndex;
export const subgroupSize = TSL.subgroupSize;
export const tan = TSL.tan;
export const tangentGeometry = TSL.tangentGeometry;
export const tangentLocal = TSL.tangentLocal;
export const tangentView = TSL.tangentView;
export const tangentWorld = TSL.tangentWorld;
export const temp = TSL.temp;
export const texture = TSL.texture;
export const texture3D = TSL.texture3D;
export const textureBarrier = TSL.textureBarrier;
export const textureBicubic = TSL.textureBicubic;
export const textureCubeUV = TSL.textureCubeUV;
export const textureLoad = TSL.textureLoad;
export const textureSize = TSL.textureSize;
export const textureStore = TSL.textureStore;
export const thickness = TSL.thickness;
export const threshold = TSL.threshold;
export const time = TSL.time;
export const timerDelta = TSL.timerDelta;
export const timerGlobal = TSL.timerGlobal;
export const timerLocal = TSL.timerLocal;
export const toOutputColorSpace = TSL.toOutputColorSpace;
export const toWorkingColorSpace = TSL.toWorkingColorSpace;
export const toneMapping = TSL.toneMapping;
export const toneMappingExposure = TSL.toneMappingExposure;
export const toonOutlinePass = TSL.toonOutlinePass;
export const transformDirection = TSL.transformDirection;
export const transformNormal = TSL.transformNormal;
export const transformNormalToView = TSL.transformNormalToView;
export const transformedBentNormalView = TSL.transformedBentNormalView;
export const transformedBitangentView = TSL.transformedBitangentView;
export const transformedBitangentWorld = TSL.transformedBitangentWorld;
export const transformedClearcoatNormalView = TSL.transformedClearcoatNormalView;
export const transformedNormalView = TSL.transformedNormalView;
export const transformedNormalWorld = TSL.transformedNormalWorld;
export const transformedTangentView = TSL.transformedTangentView;
export const transformedTangentWorld = TSL.transformedTangentWorld;
export const transmission = TSL.transmission;
export const transpose = TSL.transpose;
export const tri = TSL.tri;
export const tri3 = TSL.tri3;
export const triNoise3D = TSL.triNoise3D;
export const triplanarTexture = TSL.triplanarTexture;
export const triplanarTextures = TSL.triplanarTextures;
export const trunc = TSL.trunc;
export const tslFn = TSL.tslFn;
export const uint = TSL.uint;
export const uniform = TSL.uniform;
export const uniformArray = TSL.uniformArray;
export const uniformGroup = TSL.uniformGroup;
export const uniforms = TSL.uniforms;
export const userData = TSL.userData;
export const uv = TSL.uv;
export const uvec2 = TSL.uvec2;
export const uvec3 = TSL.uvec3;
export const uvec4 = TSL.uvec4;
export const varying = TSL.varying;
export const varyingProperty = TSL.varyingProperty;
export const vec2 = TSL.vec2;
export const vec3 = TSL.vec3;
export const vec4 = TSL.vec4;
export const vectorComponents = TSL.vectorComponents;
export const velocity = TSL.velocity;
export const vertexColor = TSL.vertexColor;
export const vertexIndex = TSL.vertexIndex;
export const vibrance = TSL.vibrance;
export const viewZToLogarithmicDepth = TSL.viewZToLogarithmicDepth;
export const viewZToOrthographicDepth = TSL.viewZToOrthographicDepth;
export const viewZToPerspectiveDepth = TSL.viewZToPerspectiveDepth;
export const viewport = TSL.viewport;
export const viewportBottomLeft = TSL.viewportBottomLeft;
export const viewportCoordinate = TSL.viewportCoordinate;
export const viewportDepthTexture = TSL.viewportDepthTexture;
export const viewportLinearDepth = TSL.viewportLinearDepth;
export const viewportMipTexture = TSL.viewportMipTexture;
export const viewportResolution = TSL.viewportResolution;
export const viewportSafeUV = TSL.viewportSafeUV;
export const viewportSharedTexture = TSL.viewportSharedTexture;
export const viewportSize = TSL.viewportSize;
export const viewportTexture = TSL.viewportTexture;
export const viewportTopLeft = TSL.viewportTopLeft;
export const viewportUV = TSL.viewportUV;
export const wgsl = TSL.wgsl;
export const wgslFn = TSL.wgslFn;
export const workgroupArray = TSL.workgroupArray;
export const workgroupBarrier = TSL.workgroupBarrier;
export const workgroupId = TSL.workgroupId;
export const workingToColorSpace = TSL.workingToColorSpace;
export const xor = TSL.xor;
