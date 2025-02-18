export interface APIResponseInterface<T> {
    code?: number;
    message?: string;
    data?: T;
}