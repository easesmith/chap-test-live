const CHAPERONE_LOGO_BASE64_URL = "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"


module.exports = {
    CHAPERONE_LOGO_BASE64_URL
}