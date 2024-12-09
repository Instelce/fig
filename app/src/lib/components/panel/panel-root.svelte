<script lang="ts" module>
  import type {Snippet} from "svelte";
  import type {HTMLAttributes} from "svelte/elements";
  import type {WithElementRef} from "bits-ui";

  export type PanelRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    side: "left" | "right";
    width?: number;
    minWidth?: number;
    children: Snippet
  }
</script>

<script lang="ts">
  import {cn} from "@fig/ui/utils";

  let {
    ref = $bindable(undefined),
    class: className,
    side,
    width = $bindable(275),
    minWidth = 275,
    children
  }: PanelRootProps = $props();

  let resizing = $state(false);

  function resize(e: MouseEvent) {
    if (resizing && ref) {
      let bbox = ref.getBoundingClientRect();
      let newWidth = side === "left" ? e.clientX - bbox.left : bbox.right - e.clientX;
      width = Math.max(minWidth, newWidth);
    }
  }
</script>

<svelte:window
  onmousemove={resize}
  onmouseup={() => resizing = false}/>

<div
  bind:this={ref}
  class={cn("h-full relative block bg-background border-border transition-none", side === "left" ? "left-0 border-r-2" : "right-0 border-l-2", className)}
  style:width={width + "px"}
>
  {@render children()}

  <button
    class={cn("absolute top-0 w-2 h-full flex justify-center *:hover:bg-primary/50 cursor-col-resize", side === "left" ? "right-0 translate-x-1" : "left-0 -translate-x-1")}
    onmousedown={() => resizing = true}>
    <span class="w-0.5 h-full delay-300 transition-colors"></span>
  </button>
</div>