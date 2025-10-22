import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor(private readonly jwtService: JwtService) {
    const esTransportOpts = {
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD,
        },
      },
      indexPrefix: 'logs-aichatbot',
      dataStream: true,
      op_type: 'create',
      source: 'aichatbot-api',
      transformer: (logData: any) => {
        return {
          '@timestamp': new Date().toISOString(),
          severity: logData.level,
          fields: {
            ...logData.meta,
            environment: process.env.NODE_ENV || 'development',
            service: 'aichatbot-api',
          },
          message: logData.message,
          error: logData.error,
          trace: {
            userId: logData.userId,
            requestId: logData.requestId,
            correlationId: logData.correlationId,
          },
          http: {
            method: logData.method,
            url: logData.url,
            userAgent: logData.userAgent,
            ip: logData.ip,
          },
        };
      },
    };

    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'logs-aichatbot',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [new ElasticsearchTransport(esTransportOpts)],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const userId = meta.userId || 'anonymous';
              const requestId = meta.requestId || '-';
              return `[${timestamp}] ${level} [${userId}] [${requestId}]: ${message}`;
            }),
          ),
        }),
      );
    }
  }

  private extractRequestInfo(request?: Request) {
    if (!request) {
      return {
        userId: 'system',
        requestId: `req_${Date.now()}`,
        correlationId: `corr_${Date.now()}`,
      };
    }

    let userId = 'anonymous';

    // Try to get user_id from request.user first
    if ((request as any).user?.id) {
      userId = (request as any).user.id;
    }

    // If not found, try to parse from Authorization header
    else {
      try {
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);

          const payload = this.jwtService.verify(token);

          if (payload && payload.sub) {
            userId = payload.sub;
          }
        }
      } catch (error) {
        // Token parsing failed, keep userId as 'anonymous'
      }
    }

    return {
      userId,
      requestId: request.headers['x-request-id'] || `req_${Date.now()}`,
      correlationId: request.headers['x-correlation-id'] || `corr_${Date.now()}`,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      params: request.params,
      query: request.query,
      body: this.sanitizeBody(request.body),
    };
  }

  private sanitizeBody(body: any) {
    if (!body) return null;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private requestToCurl(request: Request): string {
    if (!request) return '';

    const method = request.method || 'GET';
    const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
    const auth = request.headers.authorization || '';

    let curl = `curl -X ${method} '${fullUrl}'`;

    // Add authorization if exists
    if (auth) {
      curl += ` -H 'Authorization: ${auth}'`;
    }

    // Add content-type for POST/PUT requests
    curl += ` -H 'Content-Type: application/json'`;

    // Add body if exists
    if (request.body && Object.keys(request.body).length > 0) {
      const body = JSON.stringify(request.body).replace(/'/g, "'\\''");
      curl += ` -d '${body}'`;
    }

    return curl;
  }

  error(message: string, error: any, request?: Request) {
    const requestInfo = this.extractRequestInfo(request);
    const errorInfo = {
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      ...requestInfo,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
        type: error?.constructor?.name,
      },
      context: {
        functionName: (new Error().stack || '').split('\n')[2]?.trim(),
      },
      curlCommand: request ? this.requestToCurl(request) : undefined,
    };

    this.logger.error(errorInfo);
  }

  warn(message: string, meta?: any, request?: Request) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.warn({
      message,
      level: 'warn',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }

  info(message: string, meta?: any, request?: Request) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.info({
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }

  debug(message: string, meta?: any, request?: Request) {
    const requestInfo = this.extractRequestInfo(request);
    this.logger.debug({
      message,
      level: 'debug',
      timestamp: new Date().toISOString(),
      ...meta,
      ...requestInfo,
    });
  }
}
