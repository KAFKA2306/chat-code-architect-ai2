import express from 'express';
import serverless from 'serverless-http';
import { app } from '../../server/index';

const handler = serverless(app);

export { handler };