"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomVec3 = randomVec3;
const gl_matrix_1 = require("gl-matrix");
// rangeMin and rangeMax are vec3 values specifying min/max per axis
function randomVec3(rangeMin, rangeMax) {
    return gl_matrix_1.vec3.fromValues(rangeMin[0] + Math.random() * (rangeMax[0] - rangeMin[0]), rangeMin[1] + Math.random() * (rangeMax[1] - rangeMin[1]), rangeMin[2] + Math.random() * (rangeMax[2] - rangeMin[2]));
}
//# sourceMappingURL=random.js.map