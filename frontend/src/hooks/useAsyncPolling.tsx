import React, { useState } from 'react';
import { useAsync, useInterval } from 'react-use';

const useAsyncPolling: React.FC<any> = props => {
    const [variable, setVariable] = useState(0);

    useInterval(() => {
        setVariable(variable + 1);
    }, 1000);

    console.log(props)
    return useAsync(async () => await props(), [variable]);
};

export default useAsyncPolling;
