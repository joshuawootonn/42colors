import { Point } from '../../models';
import { useLocation } from 'react-router-dom';
import qs from 'query-string';

interface ValidUseMapPositionQueryString {
    isValid: true;
    mapPosition: Point;
}
interface InvalidUseMapPositionQueryString {
    isValid: false;
}
export type UseMapPositionQueryString =
    | ValidUseMapPositionQueryString
    | InvalidUseMapPositionQueryString;

export const useMapPositionQueryString = (): UseMapPositionQueryString => {
    const location = useLocation();
    const query = qs.parse(location.search);
    if (
        typeof query.x == 'string' &&
        !isNaN(parseInt(query.x)) &&
        typeof query.y == 'string' &&
        !isNaN(parseInt(query.y))
    ) {
        return {
            isValid: true,
            mapPosition: {
                x: parseInt(query.x),
                y: parseInt(query.y),
            },
        };
    }
    return {
        isValid: false,
    };
};
