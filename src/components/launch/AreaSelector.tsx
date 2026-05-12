import { useEffect, useMemo, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";

type Point = {
	x: number;
	y: number;
};

type Rect = Point & {
	width: number;
	height: number;
};

const MIN_SELECTION_SIZE = 10;

function getSelectionRect(start: Point, current: Point): Rect {
	const x = Math.min(start.x, current.x);
	const y = Math.min(start.y, current.y);
	const width = Math.abs(current.x - start.x);
	const height = Math.abs(current.y - start.y);

	return { x, y, width, height };
}

export function AreaSelector() {
	const t = useScopedT("launch");
	const params = useMemo(() => new URLSearchParams(window.location.search), []);
	const originX = Number(params.get("originX") ?? 0);
	const originY = Number(params.get("originY") ?? 0);
	const [start, setStart] = useState<Point | null>(null);
	const [current, setCurrent] = useState<Point | null>(null);

	const selection = start && current ? getSelectionRect(start, current) : null;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				void window.electronAPI.cancelAreaSelection();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		const point = { x: event.clientX, y: event.clientY };
		setStart(point);
		setCurrent(point);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!start) return;
		setCurrent({ x: event.clientX, y: event.clientY });
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!start) return;

		const finalSelection = getSelectionRect(start, { x: event.clientX, y: event.clientY });
		setStart(null);
		setCurrent(null);

		if (finalSelection.width < MIN_SELECTION_SIZE || finalSelection.height < MIN_SELECTION_SIZE) {
			return;
		}

		void window.electronAPI.completeAreaSelection({
			x: Math.round(originX + finalSelection.x),
			y: Math.round(originY + finalSelection.y),
			width: Math.round(finalSelection.width),
			height: Math.round(finalSelection.height),
		});
	};

	return (
		<div
			className="fixed inset-0 cursor-crosshair select-none bg-black/25"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			<div className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs text-white shadow-lg">
				{t("areaSelector.instructions")}
			</div>
			{selection && (
				<div
					className="absolute border-2 border-[#34B27B] bg-[#34B27B]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
					style={{
						left: selection.x,
						top: selection.y,
						width: selection.width,
						height: selection.height,
					}}
				>
					<div className="absolute -bottom-7 left-0 rounded bg-black/70 px-2 py-1 text-[11px] text-white">
						{Math.round(selection.width)} x {Math.round(selection.height)}
					</div>
				</div>
			)}
		</div>
	);
}
