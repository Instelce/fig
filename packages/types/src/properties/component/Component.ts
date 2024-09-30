// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { DocumentationLink } from "../DocumentationLink";

/**
 * A description of a main component. Helps you identify which component instances are attached to
 */
export type Component = { 
/**
 * The key of the component
 */
key: string, 
/**
 * The name of the component
 */
name: string, 
/**
 * The description of the component as entered in the editor
 */
description: string, 
/**
 * The ID of the component set if the component belongs to one
 */
componentSetId: string, 
/**
 * The documentation links for this component.
 */
documentationLinks: Array<DocumentationLink>, 
/**
 * Whether this component is a remote component that doesn't live in this file
 */
remote: boolean, };
