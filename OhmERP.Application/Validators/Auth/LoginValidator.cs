using FluentValidation;
using OhmERP.Application.DTOs.Auth;

namespace OhmERP.Application.Validators.Auth;

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Geçerli bir e-posta giriniz.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Þifre boþ býrakýlamaz.");
    }
}
