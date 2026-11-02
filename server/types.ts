import { Request } from 'express';

export interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  nodeVersion: string;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  planes: {
    dataPlane: {
      status: 'operational';
      protocols: string[];
      activeConnections: number;
    };
    controlPlane: {
      status: 'operational';
      activeServices: number;
    };
  };
}
