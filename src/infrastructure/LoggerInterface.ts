export default interface LoggerInterface {
    info(message: string, data: any): void
    error(message: string, data: any): void
}