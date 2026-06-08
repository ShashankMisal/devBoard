import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-list',
  templateUrl: './skeleton-list.component.html',
  styleUrl: './skeleton-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonListComponent {
  @Input() rows = 3;

  get rowItems(): number[] {
    return Array.from({ length: Math.max(1, this.rows) }, (_, index) => index);
  }
}
