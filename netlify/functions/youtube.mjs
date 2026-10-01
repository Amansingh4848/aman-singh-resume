import youtube from '../../api/youtube.js';
import adapter from '../lib/adapter.cjs';
export default async(request,context)=>adapter.runHandler(youtube,request,context);
export const config={path:'/api/youtube'};
