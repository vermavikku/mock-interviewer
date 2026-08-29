import { Global, Module } from '@nestjs/common';
import { SessionJsonService } from './session-json.service';

@Global()
@Module({
  providers: [SessionJsonService],
  exports: [SessionJsonService],
})
export class SessionStorageModule {}
