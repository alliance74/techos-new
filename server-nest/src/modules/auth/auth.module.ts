import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { Employee } from '../../entities/employee.entity';
import { Notification } from '../../entities/notification.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Employee,
      Notification,
      ChannelMember,
      MeetingParticipant,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        
        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any, // JWT library accepts string but type definition is strict
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
