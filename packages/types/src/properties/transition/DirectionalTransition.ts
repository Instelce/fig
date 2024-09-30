// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { DirectionalTransitionDirection } from "./DirectionalTransitionDirection";
import type { DirectionalTransitionType } from "./DirectionalTransitionType";
import type { Easing } from "../easing/Easing";

/**
 * Describes an animation used when navigating in a prototype.
 */
export type DirectionalTransition = { directionalTransitionType: DirectionalTransitionType, direction: DirectionalTransitionDirection, 
/**
 * The duration of the transition in milliseconds.
 */
duration: number, 
/**
 * The easing curve of the transition.
 */
easing: Easing, 
/**
 * When the transition type is "SMART_ANIMATE" or when matchLayers is true, then the transition will be performed using smart animate, which attempts to match corresponding layers and interpolate other properties during the animation.
 */
matchLayers: boolean, };
