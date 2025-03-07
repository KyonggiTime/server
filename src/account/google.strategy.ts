import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_SECRET'),
      callbackURL: 'https://api.kyonggiti.me/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails } = profile;
    const email = emails[0].value;
    const userEntity = await this.accountRepository.findOne({
      where: {
        email,
      },
    });
    if (userEntity != null) {
      done(
        null,
        {
          email,
        },
        accessToken as unknown as object,
      );
    } else {
      const newUserEntity = Account.of(email);
      await this.accountRepository.save(newUserEntity);
      done(
        null,
        {
          email,
        },
        accessToken as unknown as object,
      );
    }
  }
}
