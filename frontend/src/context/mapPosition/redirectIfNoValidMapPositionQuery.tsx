import React, { FC } from 'react';
import { Redirect } from 'react-router-dom';
import { useMapPositionQueryString } from './useMapPositionQueryString';

export const RedirectIfNoValidMapPositionQuery: FC = () => {
    const { isValid } = useMapPositionQueryString();

    return isValid ? null : <Redirect to="/?x=0&y=0" />;
};
