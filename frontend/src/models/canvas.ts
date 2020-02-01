export interface CanvasSettings {
    lazyRadius: number;
    brushRadius: number;
    brushColor: string;
    catenaryColor: string;
}

export interface CanvasProps extends CanvasSettings {
    loadTimeOffset: number;
    gridColor: string;
    backgroundColor: string;
    hideGrid: boolean;
    canvasWidth: string;
    canvasHeight: string;
    disabled: boolean;
    imgSrc: string;
    saveData: string;
    immediateLoading: boolean;
}
