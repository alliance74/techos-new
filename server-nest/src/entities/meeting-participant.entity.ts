import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('meeting_participants')
export class MeetingParticipant {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  meeting_id: string;

  @Column()
  user_id: string;

  @Column({ default: 'pending' })
  status: string; // pending, accepted, declined

  @Column({ default: false })
  is_organizer: boolean;
}
