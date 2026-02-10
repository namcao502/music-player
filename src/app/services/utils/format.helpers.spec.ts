import { formatDuration } from './format.helpers';

describe('formatDuration', () => {
  it('should format whole minutes correctly', () => {
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(120)).toBe('2:00');
    expect(formatDuration(180)).toBe('3:00');
  });

  it('should pad seconds with leading zero', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(1)).toBe('0:01');
    expect(formatDuration(9)).toBe('0:09');
  });

  it('should format mixed minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(245)).toBe('4:05');
    expect(formatDuration(359)).toBe('5:59');
  });

  it('should handle zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('should handle negative numbers', () => {
    expect(formatDuration(-1)).toBe('0:00');
    expect(formatDuration(-100)).toBe('0:00');
  });

  it('should handle NaN', () => {
    expect(formatDuration(NaN)).toBe('0:00');
  });

  it('should handle Infinity', () => {
    expect(formatDuration(Infinity)).toBe('0:00');
    expect(formatDuration(-Infinity)).toBe('0:00');
  });

  it('should truncate fractional seconds', () => {
    expect(formatDuration(65.9)).toBe('1:05');
    expect(formatDuration(119.99)).toBe('1:59');
  });

  it('should handle large values', () => {
    expect(formatDuration(3600)).toBe('60:00');
    expect(formatDuration(3661)).toBe('61:01');
  });
});
