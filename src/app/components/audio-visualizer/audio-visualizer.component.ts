import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  afterNextRender,
  viewChild
} from '@angular/core';

@Component({
  selector: 'app-audio-visualizer',
  standalone: true,
  imports: [],
  template: '<canvas #canvas class="visualizer-canvas"></canvas>',
  styleUrl: './audio-visualizer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioVisualizerComponent implements OnDestroy {
  @Input() analyser: AnalyserNode | null = null;

  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private animFrameId: number | null = null;
  private running = false;

  constructor() {
    afterNextRender(() => this.startLoop());
  }

  ngOnDestroy(): void {
    this.stopLoop();
  }

  private startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.draw();
  }

  private stopLoop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private draw(): void {
    if (!this.running) return;
    this.animFrameId = requestAnimationFrame(() => this.draw());

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas pixel size to display size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const barCount = Math.min(48, bufferLength);
    const barWidth = canvas.width / barCount;
    const gap = 1;

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i] / 255;
      const barHeight = value * canvas.height;
      const x = i * barWidth;

      ctx.fillStyle = '#1db954';
      ctx.globalAlpha = 0.6 + value * 0.4;
      ctx.fillRect(x + gap / 2, canvas.height - barHeight, barWidth - gap, barHeight);
    }
    ctx.globalAlpha = 1;
  }
}
