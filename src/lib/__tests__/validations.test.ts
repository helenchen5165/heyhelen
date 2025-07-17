import { loginSchema, registerSchema, blogSchema } from '../validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid login data', () => {
      const invalidData = {
        username: '',
        password: '123' // too short
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct register data', () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weakpass' // no numbers
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('blogSchema', () => {
    it('should validate correct blog data', () => {
      const validData = {
        title: 'Test Blog Post',
        content: 'This is a test blog post content that is long enough.',
        excerpt: 'Test excerpt',
        tags: ['tech', 'web'],
        isPublished: true
      };

      const result = blogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject too short content', () => {
      const invalidData = {
        title: 'Test Blog Post',
        content: 'Short', // too short
        isPublished: true
      };

      const result = blogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});