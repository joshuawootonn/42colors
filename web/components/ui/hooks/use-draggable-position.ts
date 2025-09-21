import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseDraggablePositionOptions = {
    isEnabled?: boolean;
    onPositionChange?: (position: { x: number; y: number }) => void;
    constrainToViewport?: boolean;
    elementRef: React.RefObject<HTMLElement | null>;
};

type UseDraggablePositionReturn = {
    position: { x: number; y: number };
    isDragging: boolean;
    hasDragged: boolean;
    onPointerDown: (event: React.PointerEvent) => void;
    setPosition: (position: { x: number; y: number }) => void;
};

type Point = {
    x: number;
    y: number;
};

const VIEWPORT_MARGIN = 10;

export function useDraggablePosition({
    isEnabled = true,
    onPositionChange,
    constrainToViewport = false,
    elementRef,
}: UseDraggablePositionOptions): UseDraggablePositionReturn {
    const [position, setPositionState] = useState({ x: 0, y: 0 });
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const scrollStartPos = useRef<Point | null>(null);
    const dragStartPos = useRef<Point | null>(null);
    const elementStartPos = useRef<Point | null>(null);

    const setPosition = useCallback(
        (newPosition: { x: number; y: number }) => {
            let constrainedPosition = newPosition;

            if (constrainToViewport) {
                const elementRect = elementRef.current?.getBoundingClientRect();

                if (elementRect == null) {
                    throw new Error(
                        'Element ref in setPosition of useDraggablePosition',
                    );
                }
                constrainedPosition = {
                    x: Math.max(
                        10,
                        Math.min(
                            window.innerWidth -
                                elementRect.width -
                                VIEWPORT_MARGIN,
                            newPosition.x,
                        ),
                    ),
                    y: Math.max(
                        10,
                        Math.min(
                            window.innerHeight -
                                elementRect.height -
                                VIEWPORT_MARGIN,
                            newPosition.y,
                        ),
                    ),
                };
            }

            setPositionState(constrainedPosition);
            onPositionChange?.(constrainedPosition);
        },
        [constrainToViewport, onPositionChange, elementRef],
    );

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            if (!isEnabled) return;

            event.preventDefault();
            event.stopPropagation();

            event.currentTarget.setPointerCapture(event.pointerId);

            setIsDragging(true);
            dragStartPos.current = { x: event.clientX, y: event.clientY };
            scrollStartPos.current = { x: window.scrollX, y: window.scrollY };

            const elementRect = elementRef.current?.getBoundingClientRect();

            if (elementRect == null) {
                throw new Error(
                    'Element ref in handleMouseDown of useDraggablePosition',
                );
            }

            elementStartPos.current = elementRect;

            const deltaX = event.clientX - dragStartPos.current.x;
            const deltaY = event.clientY - dragStartPos.current.y;
            const deltaScrollX = window.scrollX - scrollStartPos.current.x;
            const deltaScrollY = window.scrollY - scrollStartPos.current.y;

            const newPosition = {
                x: elementStartPos.current.x + deltaX - deltaScrollX,
                y: elementStartPos.current.y + deltaY - deltaScrollY,
            };

            setPosition(newPosition);
        },
        [isEnabled, elementRef, setPosition],
    );

    const onPointerMove = useCallback(
        (event: PointerEvent) => {
            if (
                !isDragging ||
                !dragStartPos.current ||
                !scrollStartPos.current ||
                !elementStartPos.current
            )
                return;

            const deltaX = event.clientX - dragStartPos.current.x;
            const deltaY = event.clientY - dragStartPos.current.y;
            const deltaScrollX = window.scrollX - scrollStartPos.current.x;
            const deltaScrollY = window.scrollY - scrollStartPos.current.y;

            const newPosition = {
                x: elementStartPos.current.x + deltaX - deltaScrollX,
                y: elementStartPos.current.y + deltaY - deltaScrollY,
            };
            const newScrollPosition = {
                x: window.scrollX,
                y: window.scrollY,
            };

            setPosition(newPosition);
            setScrollPosition(newScrollPosition);
            if (!hasDragged) {
                setHasDragged(true);
            }
        },
        [isDragging, setPosition, hasDragged],
    );

    const onPointerUp = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        dragStartPos.current = null;
        elementStartPos.current = null;
        scrollStartPos.current = null;
    }, [isDragging]);

    const onScroll = useCallback(() => {
        setScrollPosition({ x: window.scrollX, y: window.scrollY });
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('scroll', onScroll);

            return () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.removeEventListener('scroll', onScroll);
            };
        }
    }, [isDragging, onPointerMove, onPointerUp, onScroll]);

    const derivedPosition = useMemo(() => {
        return {
            x: position.x + scrollPosition.x,
            y: position.y + scrollPosition.y,
        };
    }, [position, scrollPosition]);

    return {
        position: derivedPosition,
        isDragging,
        hasDragged,
        onPointerDown: onPointerDown,
        setPosition,
    };
}
