import Point from './point';

export default interface Line {
    points: Point[];
    brushColor: string;
    brushWidth: number;
}
