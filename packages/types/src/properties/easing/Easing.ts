// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { EasingFunctionCubicBezier } from "./EasingFunctionCubicBezier";
import type { EasingFunctionSpring } from "./EasingFunctionSpring";
import type { EasingType } from "./EasingType";

/**
 * Describes an easing curve.
 */
export type Easing = { 
/**
 * The type of easing curve.
 */
easingType: EasingType, 
/**
 * A cubic bezier curve that defines the easing.
 */
easingFunctionCubicBezier: EasingFunctionCubicBezier, 
/**
 * A spring function that defines the easing.
 */
easingFunctionSpring: EasingFunctionSpring, };
