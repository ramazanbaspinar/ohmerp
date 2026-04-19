using FluentValidation;
using OhmERP.Application.DTOs.Auth;

namespace OhmERP.Application.Validators.Auth;

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Ad alaný zorunludur.");
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Soyad alaný zorunludur.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-posta zorunludur.")
            .EmailAddress().WithMessage("Lütfen geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Þifre zorunludur.")
            .MinimumLength(6).WithMessage("Þifre en az 6 karakter olmalýdýr.");
    }
}
