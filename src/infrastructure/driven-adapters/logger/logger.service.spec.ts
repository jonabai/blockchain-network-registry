import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: {
    log: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setContext', () => {
    it('should set context', () => {
      logger.setContext('TestContext');
      logger.log('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
    });
  });

  describe('setCorrelationId', () => {
    it('should set correlationId', () => {
      logger.setCorrelationId('correlation-123');
      logger.log('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[correlation-123]'));
    });
  });

  describe('log', () => {
    it('should log message', () => {
      logger.log('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
    });

    it('should log message with context', () => {
      logger.log('test message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('info message');

      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('INFO: info message'));
    });

    it('should log info message with context', () => {
      logger.info('info message', { key: 'value' });

      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('INFO: info message'));
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('warn', () => {
    it('should log warn message', () => {
      logger.warn('warn message');

      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('WARN: warn message'));
    });

    it('should log warn message with context', () => {
      logger.warn('warn message', { key: 'value' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('WARN: warn message'));
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('error message');

      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
    });

    it('should log error message with context', () => {
      logger.error('error message', { key: 'value' });

      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      logger.debug('debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('DEBUG: debug message'));
    });

    it('should log debug message with context', () => {
      logger.debug('debug message', { key: 'value' });

      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('DEBUG: debug message'));
      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      logger.verbose('verbose message');

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('VERBOSE: verbose message'));
    });

    it('should log verbose message with context', () => {
      logger.verbose('verbose message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('VERBOSE: verbose message'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });

  describe('child', () => {
    it('should create child logger with correlationId', () => {
      const childLogger = logger.child({ correlationId: 'child-correlation' });
      childLogger.info('child message');

      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[child-correlation]'));
    });

    it('should create child logger with context', () => {
      const childLogger = logger.child({ context: 'ChildContext' });
      childLogger.info('child message');

      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[ChildContext]'));
    });

    it('should create child logger with both correlationId and context', () => {
      const childLogger = logger.child({ correlationId: 'child-correlation', context: 'ChildContext' });
      childLogger.info('child message');

      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[ChildContext]'));
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('[child-correlation]'));
    });

    it('should create child logger with empty options', () => {
      const childLogger = logger.child({});
      childLogger.info('child message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('formatMessage with all parts', () => {
    it('should include timestamp, context, correlationId and additional context', () => {
      logger.setContext('TestContext');
      logger.setCorrelationId('test-correlation');
      logger.log('test message', { extra: 'data' });

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[TestContext]'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('[test-correlation]'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('{"extra":"data"}'));
    });
  });
});
