import { getStore } from '@netlify/blobs';
import access from '../../api/trade-access.js';
import adapter from '../lib/adapter.cjs';
const handler=access.createHandler(async()=>adapter.blobAdapter(getStore({name:'trade-zuko-access',consistency:'strong'})));
export default async(request,context)=>adapter.runHandler(handler,request,context);
export const config={path:'/api/trade-access'};
