<script lang="ts">
  import type {VectorPart} from "$lib/canvas/types/VectorPart";
  import type {PathCommandWithEndPoint} from "@fig/functions/path/PathCommand";
  import {centerOfSegment, getLineLength, hoverLineWithDistance} from "@fig/functions/shape/line";
  import {cursorPosition, keys} from "$lib/stores";
  import {canvasClick} from "$lib/canvas/stores/canvasClick.svelte";
  import {useId} from "@fig/functions/id";
  import {Timer} from "$lib/canvas/stores/canvasTime.svelte";
  import {EditPoint} from "$lib/canvas/components/vector/EditPoint.svelte";
  import {navigation} from "$lib/canvas/stores/navigation.svelte";
  import {getVectorContext, registerVectorPart} from "$lib/canvas/context/vectorContext";
  import {getCanvasContext} from "$lib/canvas/context/canvasContext";
  import {selector} from "$lib/canvas/components/Selector.svelte.js";
  import {line} from "$lib/canvas/primitive/line";
  import {canvasColors} from "$lib/canvas/stores/canvasColors";
  import {cursorHover} from "$lib/canvas/stores/cursorHover.svelte.js";
  import {
    handleVectorPartDragging,
    handleVectorPartDrawing,
    handleVectorPartSelection
  } from "$lib/canvas/components/vector/shared.svelte.js";
  import {removeArrayOfTupleDuplicates} from "@fig/functions/array";
  import {getHoverMarginDistance} from "@fig/functions/distance";

  type Props = {
    geometryIndex: number;
    startIndex: number;
    startCommandTuplesList: [number, number][];
    endCommandTuplesList: [number, number][];
  }

  let {
    geometryIndex,
    startIndex,
    startCommandTuplesList,
    endCommandTuplesList
  }: Props = $props();

  let hovered = $state(false);
  let clicked = $state(false);
  let dragged = $state(false);

  let centerPoint = new EditPoint();

  let loadTimer = new Timer(10, "Once");

  let canvasContext = getCanvasContext();
  let vectorContext = getVectorContext();

  // Line real and virtual commands calculated with command tuples (gi, i)[]
  let startCommandList: PathCommandWithEndPoint[] = [];
  for (const commandTuple of startCommandTuplesList) {
    startCommandList.push(vectorContext.strokeGeometries.at(commandTuple[0], commandTuple[1]) as PathCommandWithEndPoint);
  }
  let virtualStartCommandsList = $state<PathCommandWithEndPoint[]>([]);
  $effect(() => {
    virtualStartCommandsList = startCommandList.map((command) => {
      const virtualCommand = {...command};
      virtualCommand.endPoint = navigation.toVirtualPoint(virtualCommand.endPoint);
      return virtualCommand;
    })
  })

  let endCommandsList: PathCommandWithEndPoint[] = [];
  for (const commandTuple of endCommandTuplesList) {
    endCommandsList.push(vectorContext.strokeGeometries.at(commandTuple[0], commandTuple[1]) as PathCommandWithEndPoint);
  }
  let virtualEndCommandsList = $state<PathCommandWithEndPoint[]>([]);
  $effect(() => {
    virtualEndCommandsList = endCommandsList.map((command) => {
      const virtualCommand = {...command};
      virtualCommand.endPoint = navigation.toVirtualPoint(virtualCommand.endPoint);
      return virtualCommand;
    })
  })

  // Register line part
  let part: VectorPart = $state({
    id: useId(),
    type: "line",
    commandTuplesList: removeArrayOfTupleDuplicates(startCommandTuplesList.concat(endCommandTuplesList)),
    draw,
    update,
    selected: false
  });
  registerVectorPart(part);

  let virtualLine = $derived({
    start: virtualStartCommandsList[0].endPoint,
    end: virtualEndCommandsList[0].endPoint
  });

  let lineLength = $derived(getLineLength({
    start: virtualStartCommandsList[0].endPoint,
    end: virtualEndCommandsList[0].endPoint
  }))

  let center = $derived(centerOfSegment({
    start: virtualStartCommandsList[0].endPoint,
    end: virtualEndCommandsList[0].endPoint
  }));

  let showCenterPoint = $derived(lineLength > 40);

  // Force update when this variables change (trigger the redraw)
  canvasContext.updateCanvas(() => [hovered, clicked, part.selected, centerPoint.hovered]);

  // Update selected state
  handleVectorPartSelection(() => hovered, () => dragged, () => part);

  // Special case for center point
  $effect(() => {
    if (centerPoint.hovered) {
      selector.disable();
    }

    if (centerPoint.hovered && !selector.inSelection) {
      selector.disable();
    } else {
      selector.enable();
    }
  })

  // Functions
  function draw(ctx: CanvasRenderingContext2D) {
    if (!loadTimer.finished()) return;
    handleVectorPartDrawing(ctx, () => hovered, () => clicked, () => dragged, () => part, drawDefault, drawHovered, drawSelected, vectorContext);
  }

  function update() {
    // Be hovered only if nothing, but it, is being hovered
    hovered = hoverLineWithDistance({
      line: {
        start: virtualStartCommandsList[0].endPoint,
        end: virtualEndCommandsList[0].endPoint
      },
      cursorPosition: cursorPosition.offsetPos,
      distance: getHoverMarginDistance()
    }) && !selector.inSelection && (!cursorHover.hoveredPart || cursorHover.hoveredPart === part);
    clicked = hovered && canvasClick.single;
    dragged = ((dragged && canvasClick.pressed) || (hovered && canvasClick.pressed && !vectorContext.isDragged(part))) && !selector.inSelection;

    // Update HoveredPart
    if (hovered) {
      cursorHover.hoveredPart = part;
    } else if (cursorHover.hoveredPart == part) {
      cursorHover.hoveredPart = null;
    }

    // Check for selection with the rectangle selector
    if (selector.rect && selector.partsMode) {
      if (selector.rect.containLine(virtualLine)) {
        selector.selectPart(part);
      } else {
        selector.unselectPart(part);
      }
    }

    // Move with cursor
    if (dragged && vectorContext.isDragged(part)) {
      handleVectorPartDragging(vectorContext);
    }

    if (part.selected && keys.shiftPressed()) {
      canvasContext.redraw();
    }

    if (showCenterPoint) {
      // Update center point
      centerPoint.updateCenterPoint(center);
      centerPoint.update();

      // Add a new point when clicking on the center point
      if (centerPoint.clicked && vectorContext.isDragged(part) === null && !selector.inSelection) {
        vectorContext.strokeGeometries.geometryAt(geometryIndex).commands.splice(startIndex + 1, 0, {
          type: "L",
          relative: false,
          endPoint: navigation.toRealPoint(center),
        });
        // Force redrawind the whole vector to add the new VectorPoint instance
        vectorContext.updateVector();
      }
    }
  }

  // Draw functions
  function drawDefault(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: virtualStartCommandsList[0].endPoint,
      end: virtualEndCommandsList[0].endPoint,
      color: canvasColors.gray,
    });
  }

  function drawHovered(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: virtualStartCommandsList[0].endPoint,
      end: virtualEndCommandsList[0].endPoint,
      weight: 1,
      color: canvasColors.lightBlue
    });

    if (showCenterPoint) {
      centerPoint.draw(ctx);
    }
  }

  function drawSelected(ctx: CanvasRenderingContext2D) {
    line({
      ctx,
      start: virtualStartCommandsList[0].endPoint,
      end: virtualEndCommandsList[0].endPoint,
      color: canvasColors.blue,
      weight: 2
    });
  }
</script>
