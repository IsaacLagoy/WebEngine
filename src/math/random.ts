import { vec3 } from "gl-matrix";

// rangeMin and rangeMax are vec3 values specifying min/max per axis
export function randomVec3(rangeMin: vec3, rangeMax: vec3): vec3 {
    return vec3.fromValues(
        rangeMin[0] + Math.random() * (rangeMax[0] - rangeMin[0]),
        rangeMin[1] + Math.random() * (rangeMax[1] - rangeMin[1]),
        rangeMin[2] + Math.random() * (rangeMax[2] - rangeMin[2])
    );
}
