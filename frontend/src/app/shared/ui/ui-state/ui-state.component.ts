import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

export type UiStateVariant = 'empty' | 'error' | 'loading';

@Component({
  selector: 'app-ui-state',
  imports: [MatButtonModule],
  templateUrl: './ui-state.component.html',
  styleUrl: './ui-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiStateComponent {
  @Input({ required: true }) title = '';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() variant: UiStateVariant = 'empty';

  @Output() action = new EventEmitter<void>();
}
