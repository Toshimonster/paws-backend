class AnimationHandler {
    fps: number = 60
    funcs = []

    skip = Symbol("skip")
    start = Date.now()

    time = this.start

    animFrame = () => {
        const fns = this.funcs.slice()
        this.funcs.length = 0

        const t = Date.now()
        const dt = t - this.start
        const t1 = 1e3 / this.fps

        for (const f of fns)
            if (f !== this.skip) f(dt);

            while (this.time <= t + t1 / 4) this.time += t1;
            setTimeout(this.animFrame, this.time - t)
    }
}