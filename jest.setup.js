import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => require('next-router-mock'));

// Mock Next.js navigation
jest.mock('next/navigation', () => require('next-router-mock'));

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(url, init) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
  
  async json() {
    return JSON.parse(this.body);
  }
};

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  json() {
    return JSON.parse(this.body);
  }
};

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';