import * as Socket from 'socket.io';

export interface SocketIOFileClientFileinfo {
    aborted?: boolean;
    chunkSize: number;
    data: any;
    id: string;
    name: string;
    sent: number;
    size: number;
    uploadTo?: string;
}

export type SocketIOFileClientEvents = 'ready' | 'disconnected' | 'loadstart' | 'progress' | 'start' | 'stream' | 'complete' | 'abort' | 'error';

export class SocketIOFileClient {
    constructor(socket: Socket, options?: any);
    upload(files: FileList, options?: {to: string, data: any}): string[];
    on(evName: SocketIOFileClientEvents, fn?: (fileinfo: SocketIOFileClientFileinfo) => void);
    off(evName: SocketIOFileClientEvents, fn?: (fileinfo: SocketIOFileClientFileinfo) => void);
    emit(evName: SocketIOFileClientEvents, args?: any);
    abort(id: string);
    destroy();
    getUploadInfo();
    isDestroyed(): boolean;
}
