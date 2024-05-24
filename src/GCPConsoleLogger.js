
class GCPConsoleLogger {
    log(severity, message, obj) {
        const component = this.getCallerInfo();
        let logEntry = { severity, message, component };
        if (obj !== undefined) {
            if (typeof obj === 'object') {
                logEntry = { ...logEntry, ...obj };
            }
            else {
                logEntry.additionalData = obj;
            }
        }
        console.log(JSON.stringify(logEntry));
    }
    debug(message, obj) {
        this.log('DEBUG', message, obj);
    }
    info(message, obj) {
        this.log('INFO', message, obj);
    }
    notice(message, obj) {
        this.log('NOTICE', message, obj);
    }
    warn(message, obj) {
        this.log('WARNING', message, obj);
    }
    error(message, obj) {
        this.log('ERROR', message, obj);
    }
    critical(message, obj) {
        this.log('CRITICAL', message, obj);
    }
    alert(message, obj) {
        this.log('ALERT', message, obj);
    }
    emergency(message, obj) {
        this.log('EMERGENCY', message, obj);
    }
    getCallerInfo() {
        const { stack } = new Error();
        if (!stack)
            return 'unknown';
        // Split stack trace lines and find the relevant line
        const stackLines = stack.split('\n');
        // The actual caller is one level above the logger call
        const callerLine = stackLines[4]; // Adjusted to the fifth position
        if (!callerLine)
            return 'unknown';
        // Extract the class or function name
        const match = callerLine.match(/at\s+(.*)\s+\(/);
        return match ? match[1] : 'unknown';
    }
}
export default GCPConsoleLogger;