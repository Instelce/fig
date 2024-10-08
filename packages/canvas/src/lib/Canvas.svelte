<script lang="ts">
  import {onMount, tick, untrack} from "svelte";
  import type {CanvasNode} from "./types/CanvasNode";
  import {fillRect} from "$lib/primitive/rect";
  import {canvasClick} from "$lib/stores/canvasClick.svelte";
  import {canvasTime} from "$lib/stores/canvasTime.svelte";
  import {keys} from "./stores/keys.svelte";
  import {navigation} from "$lib/stores/navigation.svelte";
  import {setCanvasContext} from "$lib/context/canvasContext";
  import {cursorPosition} from "$lib/stores/cursorPosition.svelte";
  import {selector} from "$lib/components/Selector.svelte";

  type Props = {
    width: number;
    height: number;
    fullscreen: boolean;
    backgroundColor: string;
  }

  // Exports
  let {
    width = 100,
    height = 100,
    fullscreen = false,
    backgroundColor = "rgba(30, 30, 30, 1)"
  }: Props = $props();

  let pipeline: Set<CanvasNode> = $state(new Set());

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let frameId: number;

  let windowWidth = $state(0);
  let windowHeight = $state(0);
  let resizeTimeout: NodeJS.Timeout;

  let clickTimeout: NodeJS.Timeout;

  const ZOOM_AMOUNT: number = 1.1;

  // $inspect(selector.parts).with((type, values) => {
  //   console.log("Parts", values)
  // })
  // $inspect(selector.disabled).with((type, values) => {
  //   console.log("Disabled", values)
  // })
  // $inspect(keys.keyPressed).with((type, values) => {
  //   console.log("Keys", values)
  // })

  updateCanvas(() => [
    navigation.scale,
    navigation.offsetX,
    navigation.offsetY,
    windowWidth,
    windowHeight,
    keys.keyPressed,
    canvasClick.realClickPoint,
    selector.rect?.width,
    selector.rect?.height,
  ]);

  // Set canvas context
  setCanvasContext({
    register,
    unregister,
    updateCanvas,
    redraw: draw
  });

  onMount(() => {
    ctx = canvas.getContext("2d");

    // Update loop
    function loop(timestamp: number) {
      update(timestamp);
      // draw();
      frameId = requestAnimationFrame(loop);
    }

    frameId = requestAnimationFrame(loop);

    if (fullscreen) {
      width = windowWidth;
      height = windowHeight;
    }

    setTimeout(() => {
      draw();
    }, 100)

    return () => {
      cancelAnimationFrame(frameId);
    }
  });

  // Functions
  function updateCanvas(depts: () => any[]) {
    let scheduled = false;
    $effect(() => {
      depts();
      return untrack(() => {
        if (scheduled) return;
        scheduled = true;
        tick().then(() => {
          console.log("Update canvas")
          scheduled = false;
        });
        return draw();
      });
    });
  }

  function register(node: CanvasNode) {
    onMount(() => {
      pipeline.add(node);
      return () => pipeline.delete(node);
    });
  }

  function unregister(node: CanvasNode) {
    pipeline.delete(node);
  }

  function draw() {
    drawBackground();

    if (navigation.percentScale > 800) {
      drawGrid();
    }

    drawNodes();

    if (ctx) {
      selector.draw(ctx);
    }
  }

  function drawBackground() {
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      fillRect({
        ctx,
        x: width / 2,
        y: height / 2,
        width,
        height,
        color: backgroundColor
      });
    }
  }

  function drawNodes() {
    if (ctx) {
      for (const node of pipeline) {
        node.draw(ctx);
      }
    }
  }

  function drawGrid() {
    if (ctx) {
      ctx.strokeStyle = "rgb(62, 62, 62)";
      ctx.lineWidth = 1;

      ctx.beginPath();

      let cellSize = 1;
      for (
        /* Start the first line based on offsetX and scale */
        let x = (navigation.offsetX % cellSize) * navigation.scale;
        x <= width;
        /* Cell size based on scale amount */
        x += cellSize * navigation.scale
      ) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      /* Horizontal lines spanning the full height */
      for (
        /* Start the first line based on offsetY and scale */
        let y = (navigation.offsetY % cellSize) * navigation.scale;
        y <= height;
        /* Cell size based on scale amount */
        y += cellSize * navigation.scale
      ) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }

      ctx.stroke();
    }
  }

  function update(timestamp: number) {
    canvasTime.updateTimestamp(timestamp);
    canvasTime.updateTimers();

    selector.update();

    for (const node of pipeline) {
      node.update();
    }
  }

  function updateCursorPosition(e: MouseEvent) {
    cursorPosition.pos = {x: e.clientX, y: e.clientY}
  }

  function handleWindowResize() {
    if (fullscreen) {
      clearTimeout(resizeTimeout);
      width = windowWidth;
      height = windowHeight;

      resizeTimeout = setTimeout(() => {
        draw();
      }, 100);
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    if (keys.ctrlPressed()) {
      handleZoom(event);
    } else {
      handleScroll(event);
    }
  }

  function handleZoom(event: WheelEvent) {

    let oldScale = navigation.scale;
    // zooming considering the position of the cursor
    if (event.deltaY > 0) {
      navigation.scale /= ZOOM_AMOUNT;
    } else if (event.deltaY < 0 && navigation.scale <= 525) {
      navigation.scale *= ZOOM_AMOUNT;
    }
    let zoomRatio = (navigation.scale / oldScale);

    // positive if zoomed, negative if de-zoomed, hence the 1
    const scaleAmount = 1 - zoomRatio;

    const zoomRatioX = cursorPosition.x / canvas.clientWidth;
    const zoomRatioY = cursorPosition.y / canvas.clientHeight;

    // Amount zoomed from each edge of the screen
    const unitsZoomedX = (canvas.width / navigation.scale) * scaleAmount;
    const unitsZoomedY = (canvas.height / navigation.scale) * scaleAmount;

    const unitsAddLeft = unitsZoomedX * zoomRatioX;
    const unitsAddTop = unitsZoomedY * zoomRatioY;

    navigation.offsetX += unitsAddLeft;
    navigation.offsetY += unitsAddTop;
  }

  function handleScroll(event: WheelEvent) {
    console.log("Scrolling...");
    // Pan = Absolute distance to move (raw amount of scroll)
    let panX = event.deltaX;
    let panY = event.deltaY;
    // Update offsets for virtual coordinates (check out for scale)
    navigation.offsetX -= panX / navigation.scale;
    navigation.offsetY -= (panY / navigation.scale) / 2;
  }

</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight}
               on:resize={handleWindowResize}/>

<canvas onwheel={handleWheel} bind:this={canvas} {width}
        {height}
        onmousemove={updateCursorPosition}
        onclick={(e) => {
    canvasClick.setSingleClick(true, {x: e.clientX, y: e.clientY});

    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        canvasClick.resetClick()
    }, 100)
}}
        ondblclick={(e) => {
    canvasClick.setDoubleClick(true, {x: e.clientX, y: e.clientY});
}}
        onmousedown={(e) => {
    canvasClick.setPress(true, {x: e.clientX, y: e.clientY})
}}
        onmouseup={(_) => canvasClick.resetClick()}>
  <slot {width} {height}></slot>
</canvas>
