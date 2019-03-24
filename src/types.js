/* @flow */
export interface UploadOptions {
	to: string;
	data?: Object;
}

export interface FileInfo {
	originalName: string;
	name: string;
	size: number;
	mimeType: string;
}

export interface UploadInfo {
	uploadId: number;
	sent: number;
	completed: boolean;
	fileInfo: FileInfo;
	to: string;
	data: Object;
};

export interface UploadSettings {
	accepts: string[];
	maxFileSize: number;
	chunkSize: number;
	transmissionDelay: number;
}