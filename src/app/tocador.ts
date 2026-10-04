// Tocar o áudio original a partir de uma marca de tempo ("Ouvir o áudio", "Ouvir este trecho").
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { arquivoDeAudio } from './arquivosExpo';
import { lerEstado } from './loja';

export function usarTocador(audioId: string | undefined) {
  const audio = lerEstado().dados.audios.find((a) => a.id === audioId);
  const player = useAudioPlayer(audio ? arquivoDeAudio(audio.arquivo).uri : null);
  const status = useAudioPlayerStatus(player);
  return {
    tocando: status.playing,
    tocar: async (segundos = 0) => {
      if (!audio) return;
      if (status.playing) {
        player.pause();
        return;
      }
      await player.seekTo(segundos);
      player.play();
    },
    parar: () => player.pause(),
  };
}
