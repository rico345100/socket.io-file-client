import * as Socket from 'socket.io';

export interface FileInfo {
    id: string;
    name: string;
    size: number;
    chunkSize: number;
    sent: number;
    data: any;
}

export type SocketIOFileClientEvents = 'ready' | 'disconnected' | 'loadstart' | 'progress' | 'start' | 'stream' | 'complete' | 'abort' | 'error';

export class SocketIOFileClient {
    constructor(socket: Socket, options?: any);
    upload(files: FileList, options?: {to: string, data: any}): string[];
    on(evName: SocketIOFileClientEvents, fn?: (fileinfo: FileInfo) => void);
    off(evName: SocketIOFileClientEvents, fn?: (fileinfo: FileInfo) => void);
    emit(evName: SocketIOFileClientEvents, args?: any);
    abort(id: string);
    destroy();
    getUploadInfo();
    isDestroyed(): boolean;
}

