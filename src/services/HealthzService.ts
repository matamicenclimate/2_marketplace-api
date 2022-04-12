import { Service } from 'typedi'

@Service()
export default class HealthzService {
  async execute() {
    return {
      status: 'ok',
    } as const
  }
}
