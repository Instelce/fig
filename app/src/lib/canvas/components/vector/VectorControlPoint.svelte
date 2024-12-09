<script lang="ts">
  import {Rect} from "$lib/canvas/Rect.svelte";
  import {rect as drawRect} from "$lib/canvas/primitive/rect";
  import {canvasColors} from "$lib/canvas/stores/canvasColors";
  import {line} from "$lib/canvas/primitive/line";
  import {canvasClick} from "$lib/canvas/stores/canvasClick.svelte.js";
  import {Timer} from "$lib/canvas/stores/canvasTime.svelte.js";
  import type {VectorPart} from "$lib/canvas/types/VectorPart";
  import {useId} from "@fig/functions/id";
  import {getVectorContext, registerVectorPart} from "$lib/canvas/context/vectorContext";
  import {getCanvasContext} from "$lib/canvas/context/canvasContext";
  import type {CPathCommand, HasEndPoint} from "@fig/functions/path/PathCommand";
  import {
    handleVectorPartDrawing,
    handleVectorPartSelection
  } from "$lib/canvas/components/vector/shared.svelte.js";
  import {navigation} from "$lib/canvas/stores/navigation.svelte.js";

  type Props = {
    type: "start" | "end",
    geometryIndex: number;
    commandIndex: number;
  }

  let {type, geometryIndex, commandIndex}: Props = $props();

  const DIAMOND_DEFAULT_SIZE: number = 6;
  const DIAMOND_SELECTED_SIZE: number = 8;

  let hovered = $state(false);
  let clicked = $state(false);
  let dragged = $state(false);
  let active = $state(true);

  let rect: Rect = Rect.new();

  let clickTimer = new Timer(10, "Repeating");

  let canvasContext = getCanvasContext();
  let vectorContext = getVectorContext();

  let previousCommand = $state(vectorContext.strokeGeometries.at(geometryIndex, commandIndex - 1) as HasEndPoint);
  let controlledCurve = $state(vectorContext.strokeGeometries.at(geometryIndex, commandIndex) as CPathCommand);

  // End point of the control point
  let controlledPoint = $state(type === "start" ? navigation.toVirtualPoint(previousCommand.endPoint) : navigation.toVirtualPoint(controlledCurve.endPoint));
  let controlPoint = $state(navigation.toVirtualPoint(controlledCurve.controlPoints[type]));

  canvasContext.updateCanvas(() => [controlPoint, controlledCurve, hovered])

  // Register control point part
  let part: VectorPart = $state({
    id: useId(),
    type: "controlPoint",
    commandTuplesList: [],
    draw,
    update,
    selected: false
  });

  registerVectorPart(part);

  // Update rect size
  $effect(() => {
    if (part.selected) {
      rect.width = DIAMOND_SELECTED_SIZE;
      rect.height = DIAMOND_SELECTED_SIZE;
    } else {
      rect.width = DIAMOND_DEFAULT_SIZE;
      rect.height = DIAMOND_DEFAULT_SIZE;
    }
  })

  // Update selected state
  handleVectorPartSelection(() => hovered, () => dragged, () => part);

  // Functions
  function draw(ctx: CanvasRenderingContext2D) {
    if (!active) return;

    handleVectorPartDrawing(ctx, () => hovered, () => clicked, () => dragged, () => part, drawDefault, drawHovered, drawSelected, vectorContext);
  }

  function drawDefault(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: rect.center,
      end: controlledPoint,
      color: canvasColors.gray,
      weight: 1.5,
    });

    drawRect({
      ctx,
      x: rect.center.x,
      y: rect.center.y,
      width: rect.width,
      height: rect.height,
      colors: {
        background: canvasColors.white,
        stroke: canvasColors.blue,
      },
      strokeWeight: 1,
      rotation: 45,
    });
  }

  function drawHovered(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: rect.center,
      end: controlledPoint,
      color: canvasColors.lightBlue,
      weight: 1.5,
    });

    drawRect({
      ctx,
      x: rect.center.x,
      y: rect.center.y,
      width: rect.width,
      height: rect.height,
      colors: {
        background: canvasColors.white,
        stroke: canvasColors.white,
      },
      strokeWeight: 1,
      rotation: 45,
    });
  }

  function drawSelected(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: rect.center,
      end: controlledPoint,
      color: canvasColors.blue,
      weight: 1.5,
    });

    drawRect({
      ctx,
      x: rect.center.x,
      y: rect.center.y,
      width: rect.width,
      height: rect.height,
      colors: {
        background: canvasColors.blue,
        stroke: canvasColors.white,
      },
      strokeWeight: 2,
      rotation: 45,
    });
  }

  function update() {
    controlPoint = navigation.toVirtualPoint(controlledCurve.controlPoints[type]);
    rect.centerX = controlPoint.x;
    rect.centerY = controlPoint.y;
    controlledPoint = type === "start" ? navigation.toVirtualPoint(previousCommand.endPoint) : navigation.toVirtualPoint(controlledCurve.endPoint);

    hovered = rect.hovered();
    clicked = hovered && canvasClick.pressed;

    if (hovered && canvasClick.pressed && clickTimer.finished()) {
    }
  }

</script>
