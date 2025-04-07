import { renderHook, act } from '@testing-library/react-hooks';
import { useWakeWordDetection } from '../hooks/useWakeWordDetection';

jest.mock('../hooks/useVoiceAssistantCore', () => ({
  playAudioFeedback: jest.fn(),
}));

describe('useWakeWordDetection', () => {
  it('detects exact wake word and triggers listening', () => {
    const { result, rerender } = renderHook(() => useWakeWordDetection());

    act(() => {
      // @ts-ignore: access internal state for test
      result.current.isWakeWordActive = true;
      // simulate transcript containing wake word
      result.current.transcript = 'hello assistant';
    });

    rerender();

    // expect listening to be triggered
    expect(result.current.isListeningForCommand).toBe(true);
  });

  it('does not trigger on partial word match', () => {
    const { result, rerender } = renderHook(() => useWakeWordDetection());

    act(() => {
      // @ts-ignore
      result.current.isWakeWordActive = true;
      result.current.transcript = 'assistantship is important';
    });

    rerender();

    expect(result.current.isListeningForCommand).toBe(false);
  });
});