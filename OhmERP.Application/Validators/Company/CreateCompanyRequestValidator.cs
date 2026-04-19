using FluentValidation;
using OhmERP.Application.DTOs.Company;

namespace OhmERP.Application.Validators.Company;

public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotNull().WithMessage("Cari kodu boş bırakılamaz.")
            .NotEmpty().WithMessage("Cari kodu boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Cari kodu en fazla 100 karakter olabilir.")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Sistem kodlarında Türkçe karakter (Ş, Ğ, Ç, Ö, Ü, İ, ı) ve boşluk kullanılamaz. Sadece büyük harf, rakam ve alt çizgi (_) giriniz. (Örn: SATIS_MUDURU)");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Cari adı boş bırakılamaz.")
            .MaximumLength(200).WithMessage("Cari adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.ShortName)
            .MaximumLength(100).WithMessage("Kısa ad en fazla 100 karakter olabilir.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Geçerli bir cari tipi seçmelisiniz.");

        RuleFor(x => x.PrimaryContactPerson)
            .MaximumLength(150).WithMessage("İlgili kişi adı en fazla 150 karakter olabilir.");

        RuleFor(x => x.Phone1)
            .MaximumLength(20).WithMessage("Telefon numarası en fazla 20 karakter olabilir.");

        RuleFor(x => x.Phone2)
            .MaximumLength(20).WithMessage("Telefon numarası en fazla 20 karakter olabilir.");

        RuleFor(x => x.Email)
            .MaximumLength(150).WithMessage("E-posta adresi en fazla 150 karakter olabilir.")
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email)).WithMessage("Geçerli bir e-posta adresi giriniz.");

        RuleFor(x => x.Website)
            .MaximumLength(200).WithMessage("Website adresi en fazla 200 karakter olabilir.");

        RuleFor(x => x.CityId)
            .NotEmpty().WithMessage("Şehir seçimi zorunludur.");

        RuleFor(x => x.DistrictId)
            .NotEmpty().WithMessage("İlçe seçimi zorunludur.");

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Adres en fazla 500 karakter olabilir.");

        RuleFor(x => x.ZipCode)
            .MaximumLength(10).WithMessage("Posta kodu en fazla 10 karakter olabilir.");

        RuleFor(x => x.TaxOffice)
            .MaximumLength(100).WithMessage("Vergi dairesi en fazla 100 karakter olabilir.");

        RuleFor(x => x.TaxNumber)
            .MaximumLength(20).WithMessage("Vergi numarası en fazla 20 karakter olabilir.");

        RuleFor(x => x.EInvoiceAlias)
            .MaximumLength(50).WithMessage("E-Fatura etiket adı en fazla 50 karakter olabilir.");

        RuleFor(x => x.DefaultCurrency)
            .MaximumLength(5).WithMessage("Para birimi kodu en fazla 5 karakter olabilir.");

        RuleFor(x => x.PaymentTermDays)
            .GreaterThanOrEqualTo(0).When(x => x.PaymentTermDays.HasValue).WithMessage("Vade süresi 0'dan küçük olamaz.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Kredi limiti 0'dan küçük olamaz.");

        RuleFor(x => x.GLCode)
            .MaximumLength(50).WithMessage("Muhasebe hesap kodu en fazla 50 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Açıklama alanı en fazla 500 karakter olabilir.");
    }
}
