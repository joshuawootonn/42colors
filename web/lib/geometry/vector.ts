export class Vector {
    constructor(
        readonly x: number,
        readonly y: number,
        readonly magnitudeX: number,
        readonly magnitudeY: number,
    ) {
        this.x = x;
        this.y = y;
        this.magnitudeX = magnitudeX;
        this.magnitudeY = magnitudeY;
    }

    toDOMRect(): DOMRect {
        return new DOMRect(
            Math.min(this.x, this.x + this.magnitudeX),
            Math.min(this.y, this.y + this.magnitudeY),
            Math.abs(this.magnitudeX),
            Math.abs(this.magnitudeY),
        );
    }
}
