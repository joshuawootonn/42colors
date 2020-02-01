import axios from 'axios';
import { configObj } from '../context/config.context';

export default axios.create({
    baseURL: configObj.API_HOST,
});
