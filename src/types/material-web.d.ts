// Ambient declaration so the Material provider can lazily `import()` Material
// Web modules without rootstock taking a hard dependency on @material/web.
//
// The scion installs @material/web (an optional peer dependency) only if it
// uses the Material provider; its own bundler then resolves these literal
// dynamic imports and splits each control into its own chunk. rootstock's
// build leaves them external.
declare module '@material/web/*';
