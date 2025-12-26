import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { copyToClipboard } from './downloads';

/**
 * **Feature: copy-to-clipboard, Property 1: Clipboard copy produces valid PNG data**
 * **Validates: Requirements 2.1, 3.1**
 * 
 * Property: For any valid DOM element reference, when copyToClipboard is called,
 * the function SHALL either successfully write PNG image data to the clipboard
 * or return false indicating failure.
 */

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    loading: vi.fn(() => 'loading-toast-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock html2canvas
const mockToBlob = vi.fn();
const mockCanvas = {
  toBlob: mockToBlob,
};

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve(mockCanvas)),
}));

describe('copyToClipboard - Property Tests', () => {
  let mockClipboard: {
    write: ReturnType<typeof vi.fn>;
  };
  let originalNavigator: Navigator;
  let originalDevicePixelRatio: number;

  beforeEach(() => {
    // Store original values
    originalNavigator = global.navigator;
    originalDevicePixelRatio = window.devicePixelRatio;

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1,
      writable: true,
    });

    // Setup clipboard mock
    mockClipboard = {
      write: vi.fn().mockResolvedValue(undefined),
    };

    // Mock navigator.clipboard
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        clipboard: mockClipboard,
      },
      writable: true,
    });

    // Mock ClipboardItem
    global.ClipboardItem = vi.fn().mockImplementation((items) => items) as any;

    // Default mock for toBlob - success case
    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(new Blob(['test'], { type: 'image/png' }));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: copy-to-clipboard, Property 1: Clipboard copy produces valid PNG data**
   * **Validates: Requirements 2.1, 3.1**
   */
  it('Property 1: copyToClipboard always returns a boolean for any valid DOM element', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        fc.boolean(),
        async (width, height, blobSucceeds) => {
          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          if (blobSucceeds) {
            mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
              callback(new Blob(['test'], { type: 'image/png' }));
            });
          } else {
            mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
              callback(null);
            });
          }

          const result = await copyToClipboard(mockNode);

          expect(typeof result).toBe('boolean');
          if (blobSucceeds) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: copyToClipboard returns false for null input', async () => {
    const result = await copyToClipboard(null);
    expect(result).toBe(false);
  });

  it('Property 1: copyToClipboard returns false when Clipboard API is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          Object.defineProperty(global, 'navigator', {
            value: { clipboard: undefined },
            writable: true,
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 1: copyToClipboard returns false when clipboard write fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
            callback(new Blob(['test'], { type: 'image/png' }));
          });
          mockClipboard.write.mockRejectedValue(new Error('Write failed'));

          Object.defineProperty(global, 'navigator', {
            value: { clipboard: mockClipboard },
            writable: true,
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: copy-to-clipboard, Property 2: Success notification on successful copy**
   * **Validates: Requirements 2.2, 3.2**
   */
  it('Property 2: Success toast is displayed exactly once on successful copy', async () => {
    const { toast } = await import('react-hot-toast');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          vi.clearAllMocks();

          mockClipboard.write.mockResolvedValue(undefined);
          Object.defineProperty(global, 'navigator', {
            value: { clipboard: mockClipboard },
            writable: true,
          });

          mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
            callback(new Blob(['test'], { type: 'image/png' }));
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);

          expect(result).toBe(true);
          expect(toast.success).toHaveBeenCalledTimes(1);
          expect(toast.success).toHaveBeenCalledWith('Copied to clipboard', expect.any(Object));
          expect(toast.error).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: copy-to-clipboard, Property 3: Error notification on failed copy**
   * **Validates: Requirements 2.3, 3.3**
   */
  it('Property 3: Error toast is displayed exactly once when blob conversion fails', async () => {
    const { toast } = await import('react-hot-toast');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          vi.clearAllMocks();

          mockClipboard.write.mockResolvedValue(undefined);
          Object.defineProperty(global, 'navigator', {
            value: { clipboard: mockClipboard },
            writable: true,
          });

          mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
            callback(null);
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);

          expect(result).toBe(false);
          expect(toast.error).toHaveBeenCalledTimes(1);
          expect(toast.error).toHaveBeenCalledWith('Failed to copy image', expect.any(Object));
          expect(toast.success).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Error toast is displayed exactly once when clipboard write fails', async () => {
    const { toast } = await import('react-hot-toast');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          vi.clearAllMocks();

          mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
            callback(new Blob(['test'], { type: 'image/png' }));
          });
          mockClipboard.write.mockRejectedValue(new Error('Write failed'));

          Object.defineProperty(global, 'navigator', {
            value: { clipboard: mockClipboard },
            writable: true,
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);

          expect(result).toBe(false);
          expect(toast.error).toHaveBeenCalledTimes(1);
          expect(toast.error).toHaveBeenCalledWith('Failed to copy image', expect.any(Object));
          expect(toast.success).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Error toast with permission denied message when clipboard permission is denied', async () => {
    const { toast } = await import('react-hot-toast');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          vi.clearAllMocks();

          mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
            callback(new Blob(['test'], { type: 'image/png' }));
          });
          
          const permissionError = new DOMException('Permission denied', 'NotAllowedError');
          mockClipboard.write.mockRejectedValue(permissionError);

          Object.defineProperty(global, 'navigator', {
            value: { clipboard: mockClipboard },
            writable: true,
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);

          expect(result).toBe(false);
          expect(toast.error).toHaveBeenCalledTimes(1);
          expect(toast.error).toHaveBeenCalledWith('Clipboard permission denied', expect.any(Object));
          expect(toast.success).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Error toast is displayed when Clipboard API is not supported', async () => {
    const { toast } = await import('react-hot-toast');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2000 }),
        fc.integer({ min: 1, max: 2000 }),
        async (width, height) => {
          vi.clearAllMocks();

          Object.defineProperty(global, 'navigator', {
            value: { clipboard: undefined },
            writable: true,
          });

          const mockNode = {
            clientWidth: width,
            clientHeight: height,
            offsetWidth: width,
            offsetHeight: height,
          } as HTMLDivElement;

          const result = await copyToClipboard(mockNode);

          expect(result).toBe(false);
          expect(toast.error).toHaveBeenCalledTimes(1);
          expect(toast.error).toHaveBeenCalledWith('Clipboard not supported in this browser');
          expect(toast.success).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
