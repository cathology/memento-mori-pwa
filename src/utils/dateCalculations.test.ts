import { describe, it, expect } from 'vitest';
import { addYears, differenceInDays, differenceInMilliseconds } from 'date-fns';

describe('Date Calculations', () => {
  it('should correctly add years to a date', () => {
    const birth = new Date('1990-01-15');
    const death = addYears(birth, 80);
    expect(death.getFullYear()).toBe(2070);
    expect(death.getMonth()).toBe(0); // January
    expect(death.getDate()).toBe(15);
  });

  it('should handle leap year edge case (Feb 29)', () => {
    const birth = new Date('1992-02-29'); // Leap year
    const death = addYears(birth, 80);
    
    // 2072 is a leap year, so Feb 29 should exist
    expect(death.getFullYear()).toBe(2072);
    expect(death.getMonth()).toBe(1); // February
    expect(death.getDate()).toBe(29);
  });

  it('should handle Feb 29 to non-leap year', () => {
    const birth = new Date('2000-02-29');
    const death = addYears(birth, 81); // 2081 is not a leap year
    
    // Should fall back to Feb 28
    expect(death.getFullYear()).toBe(2081);
    expect(death.getMonth()).toBe(1); // February
    expect(death.getDate()).toBe(28);
  });

  it('should calculate correct number of days between dates', () => {
    const start = new Date('2000-01-01');
    const end = new Date('2001-01-01');
    const days = differenceInDays(end, start);
    expect(days).toBe(366); // 2000 was a leap year
  });

  it('should calculate correct milliseconds for countdown', () => {
    const now = new Date('2024-01-01T12:00:00');
    const future = new Date('2024-01-02T12:00:00');
    const ms = differenceInMilliseconds(future, now);
    expect(ms).toBe(24 * 60 * 60 * 1000); // 24 hours in milliseconds
  });

  it('should calculate weeks correctly', () => {
    const birth = new Date('1990-01-01');
    const death = addYears(birth, 80);
    const totalDays = differenceInDays(death, birth);
    const weeks = Math.ceil(totalDays / 7);
    
    // 80 years ≈ 4174 weeks
    expect(weeks).toBeGreaterThan(4000);
    expect(weeks).toBeLessThan(4300);
  });

  it('should calculate percentage correctly', () => {
    const birth = new Date('2000-01-01').getTime();
    const death = new Date('2080-01-01').getTime();
    const now = new Date('2040-01-01').getTime(); // Exactly halfway
    
    const percent = ((now - birth) / (death - birth)) * 100;
    expect(Math.round(percent)).toBe(50);
  });

  it('should handle countdown reaching zero', () => {
    const birth = new Date('1950-01-01');
    const death = addYears(birth, 70);
    const now = addYears(birth, 75).getTime(); // 5 years past expected death
    
    const remainingMs = Math.max(0, death.getTime() - now);
    expect(remainingMs).toBe(0);
  });
});
