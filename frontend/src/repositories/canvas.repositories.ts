import { axiosClient } from '../context/axios.context';
import { Line } from '../models';

export const getAllLines = async () => {
    try {
        const {
            data: { lines },
        } = await axiosClient.get('/api/lines');
        return lines;
    } catch (e) {
        console.error('FAILED TO GET LINES');
    }
};

export const postLine = async (line: Line) => {
    try {
        return await axiosClient.post('/api/line', line);
    } catch (e) {
        console.error('FAILED TO POST LINE');
    }
};
